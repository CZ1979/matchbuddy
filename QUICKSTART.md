# Quick Start Guide - WhatsApp Anonymization

This guide helps you get the secure WhatsApp contact feature up and running quickly.

## Prerequisites

✅ Firebase project with Blaze plan (Functions require paid plan)  
✅ Firebase CLI installed (`npm install -g firebase-tools`)  
✅ Firebase project initialized in the repository

## 5-Minute Setup

### Step 1: Install Function Dependencies

```bash
cd functions
npm install
```

### Step 2: Set Environment Variable

**For Local Development:**
```bash
cd functions
cp .env.example .env
# Edit .env and set a random salt
```

**For Production:**
```bash
firebase functions:config:set ip.hash.salt="$(openssl rand -base64 32)"
```

### Step 3: Deploy Everything

```bash
# From project root
firebase deploy
```

Or deploy individually:
```bash
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting
```

### Step 4: Test It

1. Open your deployed app
2. Find a game listing
3. Click the "WhatsApp" button
4. Verify you're redirected to WhatsApp
5. Check that phone number is NOT visible in browser DevTools → Network tab

## Verify Deployment

### Check Function is Live

```bash
firebase functions:list
```

You should see `contact` in the list.

### Check Logs

```bash
firebase functions:log
```

After clicking a WhatsApp button, you should see log entries.

### Check Firestore

In Firebase Console → Firestore:
- Open the `contactLogs` collection (created after first contact)
- Verify logs contain hashed IPs, not plain text
- Check a profile has `whatsappClicks` counter

## Troubleshooting

### Function not found (404)

**Fix:** Verify rewrites in `firebase.json`:
```json
"rewrites": [
  {
    "source": "/contact/**",
    "function": "contact"
  }
]
```

### Phone number still visible

**Fix:** Ensure frontend is deployed and using new code:
```bash
npm run build
firebase deploy --only hosting
```

Clear browser cache and test again.

### Rate limiting not working

**Fix:** This is normal on cold starts. Rate limit resets when function restarts.

For persistent rate limiting, consider using Firestore to store rate limit data.

### CORS errors

**Fix:** The function has CORS enabled. If issues persist:
1. Check Firebase Hosting is properly configured
2. Verify rewrites are before the catch-all `**` rule
3. Test with `curl -I https://yourapp.web.app/contact/testid`

## Testing Locally

### Option 1: Firebase Emulators

```bash
# Terminal 1 - Start emulators
firebase emulators:start

# Terminal 2 - Start frontend
npm run dev
```

Configure frontend to use emulator in `src/firebase.js`:
```javascript
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

### Option 2: Direct Function Test

```bash
curl -I "https://yourproject.web.app/contact/testUserId?text=Hello"
```

Should return:
```
HTTP/1.1 302 Found
Location: https://wa.me/...
```

## Monitoring

### View Real-time Logs

```bash
firebase functions:log --only contact
```

### Check Function Metrics

Firebase Console → Functions → contact → Metrics

Monitor:
- Invocations
- Execution time
- Errors

### Check Contact Logs

Firebase Console → Firestore → contactLogs

Each entry shows:
- `trainerId` - Who was contacted
- `ts` - When
- `ipHash` - Hashed IP (anonymous)
- `userAgent` - Browser info

## Next Steps

Once deployed and working:

1. ✅ Monitor logs for errors
2. ✅ Check function execution times
3. ✅ Verify rate limiting activates after 6 requests
4. ✅ Test on mobile devices
5. ✅ Update documentation if needed

## Common Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# View logs
firebase functions:log

# List functions
firebase functions:list

# Run local emulators
firebase emulators:start

# Build frontend
npm run build

# Test frontend locally
npm run dev
```

## Support

If you encounter issues:

1. Check the detailed guides:
   - `DEPLOYMENT.md` for step-by-step deployment
   - `IMPLEMENTATION.md` for technical details
   - `functions/README.md` for function specifics

2. Review Firebase Console:
   - Functions → Logs
   - Firestore → Data
   - Hosting → Release history

3. Check this repository's issues or create a new one

## Security Checklist

Before going to production:

- [ ] Environment variable `IP_HASH_SALT` is set (not default)
- [ ] Firestore rules deployed and tested
- [ ] Functions deployed and accessible
- [ ] Rate limiting tested (make 7+ requests quickly)
- [ ] Phone numbers NOT visible in browser
- [ ] WhatsApp redirect working
- [ ] Contact logs being created
- [ ] Monitoring/alerts configured

## Done!

Your secure WhatsApp contact feature is now live! 🎉

Users can contact trainers without exposing phone numbers. The server handles all sensitive data securely.
