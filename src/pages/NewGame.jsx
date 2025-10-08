import React, { useState, useEffect, useMemo } from "react";
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
import { useUserLocation } from "../hooks/useUserLocation";
import { useProfile } from "../hooks/useProfile";
import { formatDateGerman } from "../utils/date";
import { generateAgeGroups, normalizeAgeGroup } from "../utils/ageGroups";

export default function NewGame() {
  const { profile } = useProfile();
  const saved = JSON.parse(localStorage.getItem("newGameDefaults") || "{}");
  const savedAgeGroup = normalizeAgeGroup(saved.ageGroup);

  const [newGame, setNewGame] = useState({
    date: "",
    time: "",
    ageGroup: savedAgeGroup || "",
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
  const [profileGames, setProfileGames] = useState([]);
  const [legacyGames, setLegacyGames] = useState([]);

  const [ageGroups, setAgeGroups] = useState([]);
  const { location, updateLocation, isLoading } = useUserLocation();

  const myGames = useMemo(() => {
    const map = new Map();
    [...profileGames, ...legacyGames].forEach((game) => {
      map.set(game.id, game);
    });
    return Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
  }, [legacyGames, profileGames]);

  // 🧠 Altersklassen Dropdown
  useEffect(() => {
    setAgeGroups(generateAgeGroups());
  }, []);

  // 🔄 Eingaben merken
  useEffect(() => {
    const { date: _date, lat: _lat, lng: _lng, ...rest } = newGame;
    localStorage.setItem("newGameDefaults", JSON.stringify(rest));
  }, [newGame]);

  // 📍 Reverse Geocoding via Nominatim + Standortintegration
  const fillWithMyLocation = async () => {
    if (!location) {
      updateLocation();
      alert("📍 Standort wird ermittelt… bitte kurz warten.");
      return;
    }

    const { lat, lng } = location;
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
    if (!profile?.id) {
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
      const ownerName = (profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`).trim();
      await addDoc(ref, {
        ...newGame,
        ageGroup: normalizeAgeGroup(newGame.ageGroup),
        lat,
        lng,
        ownerName,
        ownerClub: profile.club || "",
        contactEmail: profile.email || "",
        contactPhone: profile.phone || "",
        trainerEmail: profile.id,
        trainerProfileId: profile.id,
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
    if (!profile?.id) {
      setProfileGames([]);
      return () => undefined;
    }
    const q = query(collection(db, "games"), where("trainerProfileId", "==", profile.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setProfileGames(list);
    });
    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setLegacyGames([]);
      return () => undefined;
    }
    const q = query(collection(db, "games"), where("trainerEmail", "==", profile.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setLegacyGames(list);
    });
    return () => unsubscribe();
  }, [profile?.id]);

  // 🗑️ Spiel löschen
  const handleDelete = async (id) => {
    if (!window.confirm("Möchtest du dieses Spiel wirklich löschen?")) return;
    await deleteDoc(doc(db, "games", id));
  };

  return (
    <div className="space-y-10 pb-16">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Spiel anlegen</h2>
            <p className="mt-2 text-sm text-slate-600">
              Gib die Details deines Freundschaftsspiels ein. Wiederkehrende Angaben werden automatisch gespeichert.
            </p>
          </div>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          )}

          <div className="grid gap-4">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Datum</span>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={newGame.date}
                onChange={(e) => setNewGame((s) => ({ ...s, date: e.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Uhrzeit</span>
              <input
                type="time"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={newGame.time}
                onChange={(e) => setNewGame((s) => ({ ...s, time: e.target.value }))}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Altersklasse</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={newGame.ageGroup}
                onChange={(e) => setNewGame((s) => ({ ...s, ageGroup: e.target.value }))}
              >
                <option value="">Bitte wählen</option>
                {ageGroups.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Spielstärke</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={newGame.strength}
                onChange={(e) => setNewGame((s) => ({ ...s, strength: e.target.value }))}
              >
                <option value="">Spielstärke (1–10)</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Spielort</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={newGame.locationType}
                onChange={(e) => setNewGame((s) => ({ ...s, locationType: e.target.value }))}
              >
                <option value="home">Zuhause</option>
                <option value="away">Auswärts</option>
                <option value="both">Beides möglich</option>
              </select>
            </label>

            {newGame.locationType !== "away" && (
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">Adresse</p>
                  <button
                    type="button"
                    onClick={fillWithMyLocation}
                    disabled={isLoading}
                    className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 disabled:opacity-50"
                  >
                    Standort übernehmen
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Straße und Hausnummer"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={newGame.address}
                  onChange={(e) => setNewGame((s) => ({ ...s, address: e.target.value }))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="PLZ"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={newGame.zip}
                    onChange={(e) => setNewGame((s) => ({ ...s, zip: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Ort"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    value={newGame.city}
                    onChange={(e) => setNewGame((s) => ({ ...s, city: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Sonstige Hinweise</span>
              <textarea
                placeholder="Hinweise (optional)"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                rows={3}
                value={newGame.notes}
                onChange={(e) => setNewGame((s) => ({ ...s, notes: e.target.value }))}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={createGame}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Speichern…" : "Spiel veröffentlichen"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Meine Spiele</h2>
          <span className="text-xs font-medium text-slate-500">{myGames.length} Einträge</span>
        </div>

        {myGames.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Du hast noch keine Spiele angelegt.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {myGames.map((g) => {
              const normalizedGroup = normalizeAgeGroup(g.ageGroup);
              return (
                <li
                  key={g.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">
                      {formatDateGerman(g.date)} {g.time && `• ${g.time}`}{" "}
                      {normalizedGroup && `• ${normalizedGroup}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {g.ownerClub && `${g.ownerClub} — `}
                      {g.ownerName}
                    </p>
                    {g.address && (
                      <p className="text-xs text-slate-400">
                        {g.address}, {g.zip} {g.city}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    className="mt-3 inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 sm:mt-0"
                  >
                    Spiel löschen
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
