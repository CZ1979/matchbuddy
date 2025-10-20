# 🏆 MatchBuddy

**MatchBuddy** ist eine Progressive Web App (PWA) zur intelligenten Organisation von Freundschaftsspielen im Jugendfußball.  
Die App hilft Trainer:innen, schnell passende Gegner:innen für Testspiele zu finden – ganz ohne Chaos in WhatsApp-Gruppen.

---

## 🚀 Ziel & Nutzen

Viele Trainer kennen das Problem:  
> „Wer hat am Samstag Zeit für ein Testspiel?“  
> – und daraufhin 50 Nachrichten in WhatsApp.

**MatchBuddy** löst genau dieses Problem.

- Trainer:innen können **Freundschaftsspiele anlegen**, mit Angaben zu Ort, Datum, Uhrzeit, Altersklasse und Spielstärke.  
- Andere Teams in der Umgebung sehen diese Spiele und können sich **direkt per WhatsApp oder Telefon melden**.  
- Durch **Standort- und Profildaten** werden **nur relevante Spiele im Umkreis** angezeigt.  
- So sparen Trainer:innen Zeit und behalten den Überblick über offene und geplante Spiele.

---

## ⚙️ Technischer Überblick

| Technologie            | Beschreibung |
|------------------------|---------------|
| **Frontend Framework** | React + Vite |
| **Styling**            | Tailwind CSS |
| **Backend / Datenbank**| Firebase Firestore |
| **Functions**          | Firebase Cloud Functions (Node.js) |
| **Hosting**            | Firebase Hosting (CI/CD via GitHub Actions) |
| **Authentication**     | (optional) Firebase Auth – für spätere Erweiterungen vorgesehen |
| **PWA-Support**        | App installierbar auf Android/iOS/Home-Screen mit eigenem Favicon |
| **API / Datenstruktur**| Firebase Collections `profiles` und `games` |
| **Deployment Pipeline**| Automatischer Build & Deploy über GitHub → Firebase Hosting |

---

## 📱 Hauptfunktionen

- ✅ Erstellung und Verwaltung von Spielen (`games`)
- ✅ Trainerprofile mit Club, Ort, Kontaktdaten (`profiles`)
- ✅ **Telefonnummern-Verifikation** über Firebase Phone Authentication (SMS)
- ✅ **Sichere WhatsApp-Kontaktaufnahme** über Server-seitige Weiterleitung (Telefonnummern werden nicht im Client angezeigt)
- ✅ Anzeige passender Spiele im Umkreis
- ✅ PWA (Installierbar wie eine native App)
- ⚙️ Testdaten (30 Beispielspiele & Trainer)
- 🔜 Geplante Features:
  - Login & Profilerstellung
  - Filter nach Altersklasse & Spielstärke
  - Push-Notifications
  - Kartenansicht mit Radius-Suche

---

## 🧩 Datenstruktur

### **Collection: `profiles`**
```json
{
  "id": "profile_001",
  "name": "Christof Zahn",
  "club": "SKG Sprendlingen",
  "city": "Dreieich",
  "email": "christof@skg.de",
  "phone": {
    "countryCode": "+49",
    "number": "1701234567"
  },
  "phoneVerified": true,
  "lat": 50.001,
  "lon": 8.700
}
```

### **Collection: `games`**
```json
{
  "id": "game_001",
  "date": "2025-10-12",
  "time": "10:30",
  "team": "E1",
  "opponent": null,
  "status": "open",
  "location": {
    "street": "Im Haag 10",
    "zip": "63303",
    "city": "Dreieich",
    "lat": 50.001,
    "lon": 8.700
  },
  "trainer": {
    "name": "Christof Zahn",
    "club": "SKG Sprendlingen",
    "email": "christof@skg.de",
    "phone": "+491701234567"
  }
}
```

---

## 📞 Telefonnummern-Verifikation

MatchBuddy nutzt **Firebase Phone Authentication** zur Verifizierung von Telefonnummern. Dies stellt sicher, dass nur echte Trainer:innen mit verifizierten Kontaktdaten die App nutzen können.

### Funktionsweise

1. **Onboarding**: Nach dem Ausfüllen des Profils erscheint der Verifikations-Schritt
2. **SMS-Code**: Nutzer erhalten einen 6-stelligen Code per SMS
3. **Verifizierung**: Nach Eingabe des Codes wird `phoneVerified = true` im Profil gesetzt
4. **Status-Anzeige**: Im Profil wird der Verifizierungsstatus angezeigt
5. **Banner**: Nicht-verifizierte Nutzer sehen einen Banner mit Aufforderung zur Verifikation

### Testumgebung

Für die lokale Entwicklung und Tests sollten **Testnummern** in Firebase konfiguriert werden:

```
Testnummer: +49 1234567890
Code: 123456
```

So kannst du die Verifikation testen, ohne echte SMS zu versenden. Die Testnummern werden in der Firebase Console unter "Authentication" → "Settings" → "Phone numbers for testing" hinzugefügt.

---

## 🔒 Sichere WhatsApp-Kontaktaufnahme

MatchBuddy schützt die Privatsphäre von Trainern durch **serverseitige Telefonnummer-Anonymisierung**.

### Funktionsweise

1. **Client**: Nutzer klickt auf "WhatsApp kontaktieren" Button
2. **Backend**: Firebase Function holt Telefonnummer aus Firestore
3. **Sanitization**: Nummer wird in E.164-Format konvertiert
4. **Redirect**: 302-Weiterleitung direkt zu WhatsApp
5. **Logging**: Anonymisiertes Logging mit gehashten IP-Adressen

### Sicherheitsfeatures

- ✅ Telefonnummern sind **niemals im Client sichtbar** (HTML, JS, Network Logs)
- ✅ **Rate Limiting**: Max. 6 Anfragen pro Minute pro IP-Adresse
- ✅ **IP-Hashing**: IPs werden mit SHA256 + Salt gehasht vor dem Logging
- ✅ **Firestore Rules**: Clients können `phone` schreiben, aber nicht lesen
- ✅ **Click-Tracking**: Automatische Zählung von WhatsApp-Kontaktversuchen

### Firebase Function Endpoint

```
GET /contact/:trainerId?text=<message>
```

Siehe `functions/README.md` für Details zur Function-Implementierung.

---

## 🧰 Lokale Entwicklung

### 1️⃣ Repository klonen
```bash
git clone https://github.com/CZ1979/matchbuddy.git
cd matchbuddy
```

### 2️⃣ Abhängigkeiten installieren
```bash
npm install
```

### 3️⃣ Firebase konfigurieren  
Erstelle in der Projektwurzel eine `.env`-Datei mit deinen Firebase-Credentials:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

#### Firebase Phone Authentication einrichten

1. **Firebase Console öffnen**: Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. **Authentication aktivieren**: 
   - Navigiere zu "Build" → "Authentication" → "Sign-in method"
   - Aktiviere "Phone" als Anmeldemethode
3. **Autorisierte Domains hinzufügen**:
   - Füge deine Domain(s) zu den autorisierten Domains hinzu (z.B. `localhost`, `friendly-match-finder-2ff7a.web.app`)
   - Für lokale Entwicklung: `localhost` ist standardmäßig autorisiert
4. **Testnummern einrichten** (optional für Entwicklung):
   - Gehe zu "Authentication" → "Settings" → "Phone numbers for testing"
   - Füge Testnummern mit Verifikationscodes hinzu (z.B. `+49 1234567890` mit Code `123456`)
   - Diese Nummern können ohne tatsächliche SMS verwendet werden
5. **reCAPTCHA konfigurieren**:
   - Firebase verwendet automatisch reCAPTCHA für die Verifizierung
   - Stelle sicher, dass deine Domain in den reCAPTCHA-Einstellungen autorisiert ist

### 4️⃣ Lokaler Start
```bash
npm run dev
```
App läuft dann unter: [http://localhost:5173](http://localhost:5173)

### 5️⃣ Firebase Functions einrichten (optional)

Für die sichere WhatsApp-Kontaktfunktion:

```bash
cd functions
npm install
cp .env.example .env
# Bearbeite .env und setze IP_HASH_SALT auf einen zufälligen String
```

Für Production-Deployment:
```bash
firebase functions:config:set ip.hash.salt="dein-zufaelliger-salt"
```

---

## ☁️ Deployment

Das Projekt ist über **GitHub Actions** mit Firebase Hosting verknüpft.

1. Änderungen committen und pushen:
   ```bash
   git add .
   git commit -m "Fix mobile layout"
   git push
   ```
2. GitHub Action baut automatisch und deployed auf  
   👉 [https://friendly-match-finder-2ff7a.web.app](https://friendly-match-finder-2ff7a.web.app)

---

## 💡 Design & UI

- Responsive Layout (optimiert für Mobile & Desktop)
- Einheitliche Farbwelt: **Grün (#00B86B)** als Primärfarbe
- Eigenes **Favicon** mit Fußballmotiv
- Fokus auf **Nutzbarkeit und Einfachheit**

---

## 🧭 Ausblick (Post-MVP)

- Erweiterte Filterlogik & Kartenansicht
- Favoriten & Benachrichtigungen
- Trainerprofile mit Teamhistorie
- Spielberichte & Bewertungen
- Verbesserte Performance & API-Struktur

---

## 👨‍💻 Autor

**Christof Zahn**  
MatchBuddy – *Because finding matches should be fun, not frustrating.*

🌐 [https://cz1979.github.io](https://cz1979.github.io)

---

> “I built MatchBuddy because I was tired of the endless WhatsApp chaos — and I knew there had to be a better way.”
