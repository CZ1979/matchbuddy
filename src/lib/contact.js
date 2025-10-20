/**
 * Build a secure contact URL that redirects to WhatsApp via backend
 * This prevents exposing phone numbers in the client
 * @param {string} trainerId - The trainer's user ID
 * @param {string} message - Optional message to send
 * @returns {string} The contact URL
 */
export function buildSecureContactUrl(trainerId, message = "") {
  if (!trainerId) return "";
  
  // Use the Firebase Function endpoint
  const baseUrl = "/contact/" + trainerId;
  
  if (!message) return baseUrl;
  
  // Add message as query parameter
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export default {
  buildSecureContactUrl,
};
