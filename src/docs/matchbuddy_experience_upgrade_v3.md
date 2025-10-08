## 🧩 MatchBuddy – Experience Upgrade (Startseite & Profil UX)

### 🎯 Ziel

Verbesserung der User Experience nach MVP:

* Mehr Sichtbarkeit und Dynamik auf der Startseite
* Bessere Orientierung nach dem ersten Profil-Save
* Klarheit bei fehlendem Profil
* Grundstein für spätere, datengetriebene Matching-Logik

---

## 1️⃣ **Startseite: Neueste & passende Spiele (Swipe-Kacheln)**

### Zweck

Neue Besucher (auch ohne Login) sollen direkt Spiele sehen und Lust bekommen, zu interagieren.

### Funktionale Anforderungen

* Zeige **Swipe-/Kartenansicht** mit 3–6 Spiel-Kacheln.
* Jede Karte nutzt das bestehende Game-Card-Design aus der „Games-Übersicht“:

  * Verein / Ort
  * Datum & Uhrzeit
  * Altersklasse
  * Buttons für **Route**, **WhatsApp**, **Details ansehen**
* Karten können horizontal durchgeswiped oder via Pfeile gewechselt werden.
* Kein Login erforderlich.
* Kein Klick auf einzelne Karten.
* Unterhalb ein Button **„Alle Spiele anzeigen“**, der auf `Games.jsx` führt.

### Datenlogik

1. **Basis-Query:**

   ```js
   orderBy('createdAt', 'desc')
   limit(6)
   ```
2. **Geolokalisierung:**

   * Versuche `navigator.geolocation`.
   * Fallback: IP-basierte Ortserkennung (optional).
   * Wenn beides fehlschlägt → zeige einfach alle neuesten Spiele (keine Filter).
3. **Sortierung nach Entfernung:**
   Wenn Koordinaten verfügbar → berechne Distanz zu jedem Spiel (Haversine).

### UI-Hinweis

Wenn keine Geo-Location aktiv:

> „Wir zeigen dir die neuesten Spiele – aktiviere Standort, um Spiele in deiner Nähe zu sehen.“

---

## 2️⃣ **Empfohlene Spiele (Matching-Algorithmus)**

### Ziel

Nutzer sehen automatisch relevante Spiele basierend auf ihren eigenen Profildaten und bisherigen Einträgen.

### Algorithmus-Logik (Pseudocode)

```js
user = {
  ageGroup,
  location: { lat, lon },
  strengthEstimate: avg_strength_from_user_created_games()
}

games = fetchAllGamesWithin(50km)

// 1. Altersklasse
filtered = games.filter(g => 
  g.ageGroup === user.ageGroup ||
  (g.ageGroup === younger && user.strengthEstimate === 'high')
)

// 2. Entfernung (Radius dynamisch)
if (filtered.length < 3) increase radius by 10km (max 50)

// 3. Stärke-Abgleich
filtered = filtered.filter(g => 
  abs(g.estimatedStrength - user.strengthEstimate) <= 1
)

// 4. Scoring
filtered.forEach(g => {
  g.score = (1 / g.distance) * 0.5 + (strength_match * 0.3) + (timeProximity * 0.2)
})

// 5. Sortierung & Auswahl
recommended = sortByScoreDesc(filtered).slice(0, 5)
```

### Darstellung

* Gleiche Kartenstruktur wie bei Punkt 1.
* Kombination mit Punkt 1:

  * Wenn passende Spiele gefunden → zuerst diese zeigen.
  * Wenn keine passenden gefunden → fallback auf „neueste Spiele“.

### UI-Text

> 🧭 „Diese Spiele passen zu deinem Profil“
> ✳️ „Neueste Spiele in deiner Nähe“

---

## 3️⃣ **UX nach Profil speichern**

### Ziel

Klarer nächster Schritt und positives Feedback nach dem Anlegen des Profils.

### Flow

Nach Klick auf „Profil speichern“:

1. **Toast:** „✅ Profil erfolgreich gespeichert!“
2. **Direkter Redirect** mit zwei Buttons:

   ```
   Profil gespeichert!
   👉 Jetzt neues Spiel anlegen
   🔍 Oder Spiel suchen
   ```

   * Button 1 → `/NewGame`
   * Button 2 → `/Games.jsx`

### Psychologie

Nutzer bekommt das Gefühl von Fortschritt und Belohnung.

---

## 4️⃣ **Kein Profil vorhanden – Spiele anlegen deaktiviert**

### Ziel

Klar kommunizieren, warum etwas nicht funktioniert.

### Verhalten

* Nur **„Spiel anlegen“** ist ausgegraut.
* **„Spiele suchen“** bleibt aktiv.
* Beispiel:

  ```
  ⚠️ Bitte lege zuerst dein Profil an, um Spiele zu erstellen.
  [Profil jetzt anlegen]
  ```

---

## 5️⃣ **Technische Hinweise für Implementierung**

### Datenquellen

* `profiles` (Firestore Collection)
* `games` (Firestore Collection)
* Nutzung von `createdAt`, `lat`, `lon`, `ageGroup`
* Optionale Hilfsfunktion `avg_strength_from_user_created_games()`

### Komponenten

* `GameCard` → Basis-Card mit Route/WhatsApp/Details
* `GameCarousel` → horizontales Scroll/Swipe-Element
* `RecommendationEngine.js` → Matching-Algorithmus
* `ProfileSaveFlow.js` → UX nach Profil-Speichern

### UI-Framework

* React mit Tailwind / Material
* Swipe mit `react-swipeable` oder `keen-slider`
* Toast mit `react-hot-toast` oder ähnlichem

---

### 💻 Hinweis für Implementierung

**Anforderungen:**

* Nutze bestehende Komponenten, wo möglich.
* Saubere, modulare Architektur.
* Kommentiere neuen Code für bessere Lesbarkeit.
* Alle neuen Dateien in `/components` oder `/utils` ablegen.

**Frameworks & Tools:**

* React + TailwindCSS
* Firestore (collections: `profiles`, `games`)
* `react-hot-toast` für Notifications
* `keen-slider` oder `react-swipeable` für Swipe-Karussells

**Output-Erwartung:**

* Lauffähiger React-Code
* Alle neuen/angepassten Dateien vollständig ausgeben
* Integration in bestehende Komponenten (z. B. Home.jsx, Games.jsx) explizit dokumentieren
