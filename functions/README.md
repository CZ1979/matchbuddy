# Firebase Functions - MatchBuddy

This directory contains Firebase Cloud Functions for the MatchBuddy application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and set your IP_HASH_SALT to a random secure string
   ```

3. Configure Firebase Functions environment variables (for production):
   ```bash
   firebase functions:config:set ip.hash.salt="your-random-salt-here"
   ```

## Functions

### `/contact/:trainerId`

Server-side WhatsApp contact endpoint that anonymizes phone numbers.

**Method:** GET

**Parameters:**
- `trainerId` (path) - The ID of the trainer/coach to contact
- `text` (query, optional) - Pre-filled message to send via WhatsApp

**Response:** 
- 302 redirect to WhatsApp URL
- Error codes: 400, 404, 429, 500

**Features:**
- Phone number sanitization to E.164 format
- Rate limiting: 6 requests per minute per IP
- Logging to `contactLogs` collection with hashed IPs
- Atomic counter increment for `whatsappClicks` field

**Example:**
```
GET /contact/user123?text=Hello%20Coach!
→ Redirects to: https://wa.me/491701234567?text=Hello%20Coach!
```

## Security

- Phone numbers are never exposed to the client
- IP addresses are hashed before logging
- Rate limiting prevents abuse
- Firestore security rules prevent direct phone number access

## Development

Run the emulators locally:
```bash
npm run serve
```

## Deployment

Deploy functions to Firebase:
```bash
npm run deploy
```

Or deploy from the root directory:
```bash
firebase deploy --only functions
```
