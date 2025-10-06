import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

// 📅 Hilfsfunktion für deutsches Datum
function formatDateGerman(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function NewGame() {
  const saved = JSON.parse(localStorage.getItem("newGameDefaults") || "{}");

  const [newGame, setNewGame] = useState({
    date: "",
    time: "",
    ageGroup: saved.ageGroup || "",
    strength: saved.strength || "5",
    locationType: saved.locationType || "home",
    address: saved.address || "",
    zip: saved.zip || "",
    city: saved.city || "",
    lat: "",
    lng: "",
    notes: saved.notes || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [myGames, setMyGames] = useState([]);

  // 🧠 Altersklassen Dropdown (U6–U21)
  const [ageGroups, setAgeGroups] = useState([]);
  useEffect(() => {
    const year = new Date().getFullYear();
    const list = [];
    for (let u = 6; u <= 21; u++) {
      const birthYear = year - u;
      list.push({ label: `U${u} / ${birthYear}`, value: `U${u}` });
    }
    setAgeGroups(list);
  }, []);

  // 🔄 Eingaben merken
  useEffect(() => {
    const { date, lat, lng, ...rest } = newGame;
    localStorage.setItem("newGameDefaults", JSON.stringify(rest));
  }, [newGame]);

  // 📍 Reverse Geocoding via Nominatim
  const fillWithMyLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation wird nicht unterstützt");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setNewGame((s) => ({ ...s, lat, lng }));

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        if (data.address) {
          setNewGame((s) => ({
            ...s,
            address:
              (data.address.road || "") +
              (data.address.house_number ? " " + data.address.house_number : ""),
            zip: data.address.postcode || "",
            city:
              data.address.city ||
              data.address.town ||
              data.address.village ||
              "",
          }));
        }
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
      }
    });
  };

  // 🆕 Forward Geocoding für Adresse beim Speichern
  const geocodeAddress = async (address, zip, city) => {
    if (!address && !city && !zip) return null;
    const query = [address, zip, city].filter(Boolean).join(", ");
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
      encodeURIComponent(query);
    try {
      const res = await fetch(url, { headers: { "Accept-Language": "de" } });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (err) {
      console.error("Geocoding fehlgeschlagen:", err);
    }
    return null;
  };

  // 💾 Neues Spiel speichern
  const createGame = async () => {
    const trainerEmail = localStorage.getItem("trainerEmail");
    const trainerProfile = JSON.parse(localStorage.getItem("trainerProfile") || "{}");

    if (!trainerEmail) {
      alert("Bitte zuerst dein Profil speichern, damit deine Spiele zugeordnet werden können.");
      return;
    }
    if (!newGame.date || !newGame.time || !newGame.ageGroup) {
      alert("Bitte Datum, Uhrzeit und Altersklasse ausfüllen.");
      return;
    }

    try {
      setIsSaving(true);
      let lat = null,
        lng = null;

      if (newGame.locationType !== "away") {
        const geo = await geocodeAddress(newGame.address, newGame.zip, newGame.city);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }

      const ref = collection(db, "games");
      await addDoc(ref, {
        ...newGame,
        lat,
        lng,
        ownerName: `${trainerProfile.firstName || ""} ${trainerProfile.lastName || ""}`.trim(),
        ownerClub: trainerProfile.club || "",
        contactEmail: trainerProfile.email || trainerEmail,
        contactPhone: trainerProfile.phone || "",
        trainerEmail,
        createdAt: serverTimestamp(),
      });

      setNewGame((s) => ({ ...s, date: "" }));
      setSuccessMsg("Spiel erfolgreich gespeichert!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🧩 Eigene Spiele laden (live)
  useEffect(() => {
    const trainerEmail = localStorage.getItem("trainerEmail");
    if (!trainerEmail) return;
    const q = query(collection(db, "games"), where("trainerEmail", "==", trainerEmail));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      // nach Datum sortieren
      list.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
      setMyGames(list);
    });
    return () => unsub();
  }, []);

  // 🗑️ Spiel löschen
  const handleDelete = async (id) => {
    if (!window.confirm("Möchtest du dieses Spiel wirklich löschen?")) return;
    await deleteDoc(doc(db, "games", id));
  };

  return (
    <div className="p-4 space-y-8">
      {/* Spiel anlegen */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary">Neues Spiel anlegen</h2>
          <p className="text-sm text-base-content/70 mb-3">
            Gib die Details deines Freundschaftsspiels ein. Wiederkehrende Angaben
            werden automatisch gespeichert.
          </p>

          {successMsg && (
            <div className="alert alert-success text-sm py-2 mb-3">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <input
              type="date"
              className="input input-bordered w-full"
              value={newGame.date}
              onChange={(e) => setNewGame((s) => ({ ...s, date: e.target.value }))}
            />
            <input
              type="time"
              className="input input-bordered w-full"
              value={newGame.time}
              onChange={(e) => setNewGame((s) => ({ ...s, time: e.target.value }))}
            />

            {/* Altersklasse */}
            <select
              className="select select-bordered w-full"
              value={newGame.ageGroup}
              onChange={(e) => setNewGame((s) => ({ ...s, ageGroup: e.target.value }))}
            >
              <option value="">Altersklasse wählen</option>
              {ageGroups.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>

            {/* Spielstärke */}
            <select
              className="select select-bordered w-full"
              value={newGame.strength}
              onChange={(e) =>
                setNewGame((s) => ({ ...s, strength: e.target.value }))
              }
            >
              <option value="">Spielstärke (1–10)</option>
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            {/* Spielort */}
            <select
              className="select select-bordered w-full"
              value={newGame.locationType}
              onChange={(e) =>
                setNewGame((s) => ({ ...s, locationType: e.target.value }))
              }
            >
              <option value="home">Zuhause</option>
              <option value="away">Auswärts</option>
              <option value="both">Beides möglich</option>
            </select>

            {/* Adresse */}
            {newGame.locationType !== "away" && (
              <>
                <input
                  type="text"
                  placeholder="Straße und Hausnummer"
                  className="input input-bordered w-full"
                  value={newGame.address}
                  onChange={(e) =>
                    setNewGame((s) => ({ ...s, address: e.target.value }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="PLZ"
                    className="input input-bordered w-full"
                    value={newGame.zip}
                    onChange={(e) =>
                      setNewGame((s) => ({ ...s, zip: e.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Ort"
                    className="input input-bordered w-full"
                    value={newGame.city}
                    onChange={(e) =>
                      setNewGame((s) => ({ ...s, city: e.target.value }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={fillWithMyLocation}
                >
                  📍 Meine Position verwenden
                </button>
              </>
            )}

            {/* Notizen */}
            <textarea
              placeholder="Notizen (optional)"
              className="textarea textarea-bordered w-full"
              rows={3}
              value={newGame.notes}
              onChange={(e) =>
                setNewGame((s) => ({ ...s, notes: e.target.value }))
              }
            />

            <button
              onClick={createGame}
              disabled={isSaving}
              className="btn btn-primary w-full mt-4"
            >
              {isSaving ? "Speichern..." : "Spiel veröffentlichen"}
            </button>
          </div>
        </div>
      </div>

      {/* Eigene Spiele */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary">Meine Spiele</h2>

          {myGames.length === 0 && (
            <p className="text-sm text-neutral-500">
              Du hast noch keine Spiele angelegt.
            </p>
          )}

          <ul className="divide-y divide-base-200">
            {myGames.map((g) => (
              <li key={g.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {formatDateGerman(g.date)} {g.time && `• ${g.time}`}{" "}
                    {g.ageGroup && `• ${g.ageGroup}`}
                  </div>
                  <div className="text-sm text-base-content/70">
                    {g.ownerClub && `${g.ownerClub} — `}{g.ownerName}
                  </div>
                  {g.address && (
                    <div className="text-xs text-neutral-500">
                      {g.address}, {g.zip} {g.city}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="btn btn-sm btn-outline btn-error"
                >
                  🗑️ Löschen
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
