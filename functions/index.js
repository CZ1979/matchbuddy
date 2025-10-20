const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Rate limiting store (in-memory, resets on cold start)
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Sanitize phone number to E.164 format
 * Removes all non-digits and ensures proper format
 */
function sanitizePhoneNumber(phone) {
  if (!phone) return null;
  
  let phoneStr = "";
  
  // Handle object format { countryCode, number }
  if (typeof phone === "object" && phone !== null) {
    const cc = String(phone.countryCode || "").replace(/\D/g, "");
    const num = String(phone.number || "").replace(/\D/g, "").replace(/^0+/, "");
    phoneStr = cc + num;
  } else {
    // Handle string format
    phoneStr = String(phone).replace(/\D/g, "");
  }
  
  // Remove leading zeros
  phoneStr = phoneStr.replace(/^0+/, "");
  
  // Ensure it starts with country code
  if (!phoneStr) return null;
  
  // If it doesn't start with a country code, assume German number
  if (phoneStr.length > 0 && !phoneStr.startsWith("49") && phoneStr.length < 13) {
    phoneStr = "49" + phoneStr;
  }
  
  return phoneStr || null;
}

/**
 * Hash IP address with salt for privacy
 */
function hashIP(ip, salt) {
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

/**
 * Check rate limit for IP address
 * Returns true if limit exceeded
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;
  const limit = 6;
  const windowMs = 60000; // 1 minute
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });
    return false;
  }
  
  const data = rateLimitStore.get(key);
  
  // Reset if window expired
  if (now - data.firstRequest > windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
    });
    return false;
  }
  
  // Increment counter
  data.count += 1;
  
  // Check if limit exceeded
  return data.count > limit;
}

/**
 * GET /contact/:trainerId
 * Retrieves phone number and redirects to WhatsApp
 */
exports.contact = onRequest({ cors: true }, async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== "GET") {
      res.status(405).send("Method not allowed");
      return;
    }
    
    // Get trainer ID from path
    const trainerId = req.path.split("/").pop();
    
    if (!trainerId) {
      res.status(400).send("Trainer ID is required");
      return;
    }
    
    // Get client IP
    const clientIP = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
                     req.headers["x-real-ip"] || 
                     req.socket?.remoteAddress || 
                     "unknown";
    
    // Check rate limit
    if (checkRateLimit(clientIP)) {
      res.status(429).send("Too many requests. Please try again later.");
      return;
    }
    
    // Get optional text parameter
    const text = req.query.text || "";
    
    // Fetch profile from Firestore
    const profileRef = db.collection("profiles").doc(trainerId);
    const profileDoc = await profileRef.get();
    
    if (!profileDoc.exists) {
      res.status(404).send("Trainer not found");
      return;
    }
    
    const profile = profileDoc.data();
    
    // Get phone number
    const phone = profile.phone;
    
    if (!phone) {
      res.status(400).send("No phone number available");
      return;
    }
    
    // Sanitize phone to E.164 format
    const sanitizedPhone = sanitizePhoneNumber(phone);
    
    if (!sanitizedPhone) {
      res.status(400).send("Invalid phone number");
      return;
    }
    
    // Build WhatsApp URL
    let whatsappUrl = `https://wa.me/${sanitizedPhone}`;
    if (text) {
      whatsappUrl += `?text=${encodeURIComponent(text)}`;
    }
    
    // Log the contact attempt (async, don't wait)
    const salt = process.env.IP_HASH_SALT || "default-salt-change-in-production";
    const ipHash = hashIP(clientIP, salt);
    
    // Log to contactLogs collection
    db.collection("contactLogs").add({
      trainerId,
      ts: admin.firestore.FieldValue.serverTimestamp(),
      ipHash,
      userAgent: req.headers["user-agent"] || "unknown",
    }).catch(err => {
      console.error("Failed to log contact:", err);
    });
    
    // Increment whatsappClicks counter atomically
    profileRef.update({
      whatsappClicks: admin.firestore.FieldValue.increment(1),
    }).catch(err => {
      console.error("Failed to increment clicks:", err);
    });
    
    // Redirect to WhatsApp
    res.redirect(302, whatsappUrl);
    
  } catch (error) {
    console.error("Error in contact endpoint:", error);
    res.status(500).send("Internal server error");
  }
});
