# Deployment Guide - WhatsApp Anonymization Feature

This guide explains how to deploy the secure WhatsApp contact feature to your Firebase project.

## Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Firebase project initialized
3. Admin access to the Firebase project

## Deployment Steps

### 1. Configure Environment Variables

Set the IP hash salt for production:

```bash
firebase functions:config:set ip.hash.salt="generate-a-random-string-here"
```

You can generate a secure random string using:

```bash
# On Linux/Mac:
openssl rand -base64 32

# Or using Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Deploy Firestore Security Rules

First, deploy the security rules to protect phone numbers:

```bash
firebase deploy --only firestore:rules
```

⚠️ **Important**: This will prevent clients from reading the `phone` field in profiles. Make sure this is what you want before deploying.

### 3. Deploy Firebase Functions

Deploy the contact function:

```bash
firebase deploy --only functions
```

Or deploy specific function:

```bash
firebase deploy --only functions:contact
```

### 4. Deploy Frontend

Build and deploy the updated frontend:

```bash
npm run build
firebase deploy --only hosting
```

Or use the complete deployment:

```bash
firebase deploy
```

## Testing

### Local Testing (Emulators)

You can test the functions locally using Firebase emulators:

```bash
# Start emulators
firebase emulators:start

# In another terminal, run the frontend
npm run dev
```

### Production Testing

1. Open your deployed app
2. Find a game/trainer listing
3. Click the WhatsApp button
4. Verify that:
   - You are redirected to WhatsApp
   - The phone number is NOT visible in the browser's network tab
   - The pre-filled message appears in WhatsApp

## Monitoring

### View Function Logs

```bash
firebase functions:log
```

Or in Firebase Console:
- Go to Functions → Logs
- Monitor for errors or rate limiting

### Check Contact Logs

Use Firestore console to view the `contactLogs` collection:
- Verify logs are being created
- Check that IP addresses are hashed
- Verify `whatsappClicks` counter is incrementing

## Troubleshooting

### Function Returns 404

- Verify the function deployed successfully: `firebase functions:list`
- Check the rewrite rules in `firebase.json`
- Ensure the function name matches in both files

### Rate Limiting Not Working

- Rate limiting state is in-memory and resets on cold starts
- For production, consider using Redis or Firestore for persistent rate limiting

### Phone Numbers Still Visible

- Verify Firestore rules are deployed: Check Firebase Console → Firestore → Rules
- Clear browser cache and test again
- Check that the frontend is using the new `/contact/` endpoint

### CORS Errors

- The function has CORS enabled by default
- If issues persist, check Firebase Hosting rewrites are configured correctly

## Security Checklist

- [ ] Environment variable `IP_HASH_SALT` is set
- [ ] Firestore rules prevent client-side phone number reading
- [ ] Functions deployed and accessible
- [ ] Rate limiting tested and working
- [ ] Contact logs are being created with hashed IPs
- [ ] Phone numbers are NOT visible in browser network logs
- [ ] WhatsApp redirect works correctly

## Rollback

If you need to rollback to the previous version:

### Rollback Functions

```bash
# List recent deployments
firebase functions:log

# Rollback (not directly supported, need to redeploy previous version)
git checkout <previous-commit>
firebase deploy --only functions
```

### Rollback Firestore Rules

In Firebase Console:
1. Go to Firestore → Rules
2. Click "Rules History"
3. Select previous version and republish

## Support

For issues or questions:
- Check Firebase Functions logs
- Review the `functions/README.md` for function details
- Ensure all dependencies are installed in `functions/` directory
