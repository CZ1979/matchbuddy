🧩 Codex Prompt: MatchBuddy Experience Upgrade

Ziel: Verbesserung der User Experience nach MVP
→ Fokus auf Startseite, Matching-Logik, Profil-Speichern-Flow und Hinweis bei fehlendem Profil.

1️⃣ Startseite: Neueste & passende Spiele (Swipe-Kacheln)

Zweck:
Besucher (auch ohne Profil oder Login) sollen direkt aktuelle Spiele sehen.

Funktionale Anforderungen:

Zeige Swipe-/Kartenansicht mit 3–6 Spiel-Kacheln.

Jede Karte nutzt das bestehende GameCard-Design aus Games.jsx (inkl. Route, WhatsApp etc.).

Kein Klick auf einzelne Karten.

Stattdessen ein einziger Button „Alle Spiele anzeigen“, der auf Games.jsx führt.

Kein Login erforderlich.

Datenlogik:

orderBy('createdAt', 'desc')
limit(6)


Wenn navigator.geolocation aktiv → filtere nach Entfernung (Radius max. 30 km).

Wenn Geolocation nicht möglich → optional IP-Fallback, sonst einfach alle neuesten Spiele.

UI-Hinweis (wenn kein Standort):

„Wir zeigen dir die neuesten Spiele – aktiviere deinen Standort, um Spiele in deiner Nähe zu sehen.“

2️⃣ Empfohlene Spiele (Matching-Algorithmus)

Ziel:
Empfiehl Spiele basierend auf Profildaten + eigenen Spiel-Einträgen.

Algorithmus (Pseudocode):

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

// 2. Radius dynamisch erhöhen falls zu wenige Treffer
if (filtered.length < 3) radius += 10 // max 50 km

// 3. Stärkeabgleich (basierend auf eigenen Spiel-Einträgen)
filtered = filtered.filter(g => 
  abs(g.estimatedStrength - user.strengthEstimate) <= 1
)

// 4. Scoring
filtered.forEach(g => {
  g.score = (1 / g.distance) * 0.5 + (strength_match * 0.3) + (timeProximity * 0.2)
})

// 5. Sortieren & top 5 anzeigen
recommended = sortByScoreDesc(filtered).slice(0, 5)


Darstellung:

Gleiche Karten wie in Punkt 1

Kombination:

Wenn passende Spiele gefunden → zeige diese zuerst

Wenn keine passenden → fallback auf neueste Spiele

UI-Text:

🧭 „Diese Spiele passen zu deinem Profil“
✳️ „Neueste Spiele in deiner Nähe“

3️⃣ UX nach Profil speichern

Ziel:
Klarer nächster Schritt nach Speichern.

Flow:
Nach Klick auf „Profil speichern“:

Toast: „✅ Profil erfolgreich gespeichert!“

Redirect mit zwei Buttons:

Profil gespeichert!
👉 Jetzt neues Spiel anlegen
🔍 Oder Spiel suchen


Button 1 → /NewGame

Button 2 → /Games.jsx

4️⃣ Kein Profil vorhanden – Spiele anlegen deaktiviert

Ziel:
Klarer Hinweis, warum Spiel anlegen nicht funktioniert.

Verhalten:

Nur „Spiel anlegen“ ist ausgegraut.

„Spiele suchen“ bleibt aktiv.

Unter dem ausgegrauten Button:

⚠️ Bitte lege zuerst dein Profil an, um Spiele zu erstellen.
[Profil jetzt anlegen]

5️⃣ Technische Hinweise

Datenquellen:

Firestore Collections: profiles, games

Felder: createdAt, lat, lon, ageGroup

Hilfsfunktion: avg_strength_from_user_created_games()

Komponenten:

GameCard – bestehendes Layout (Route, WhatsApp etc.)

GameCarousel – Swipe/Scroll Container (react-swipeable / keen-slider)

RecommendationEngine.js – Matching-Algorithmus

ProfileSaveFlow.js – UX nach Profil-Save

Framework:

React + TailwindCSS

Toasts mit react-hot-toast oder ähnlich