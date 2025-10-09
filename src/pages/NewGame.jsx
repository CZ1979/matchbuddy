import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useUserLocation } from "../hooks/useUserLocation";
import { useProfile } from "../hooks/useProfile";
import TeamStrengthModal from "../components/TeamStrengthModal";
import { formatDateGerman } from "../utils/date";
import { generateAgeGroups, normalizeAgeGroup } from "../utils/ageGroups";

const loadSavedDefaults = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(localStorage.getItem("newGameDefaults") || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch (error) {
    console.warn("Standardwerte für neues Spiel konnten nicht geladen werden:", error);
    return {};
  }
};

const deriveProfileDefaultAgeGroup = (ageGroups = []) => {
  if (!Array.isArray(ageGroups) || ageGroups.length === 0) return "";
  if (ageGroups.length === 1) return ageGroups[0];
  const numericValues = ageGroups
    .map((value) => parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
  if (numericValues.length > 0) {
    return String(Math.max(...numericValues));
  }
  return ageGroups[0];
};

export default function NewGame() {
  const { profile } = useProfile();

  const [newGame, setNewGame] = useState(() => {
    const saved = loadSavedDefaults();
    const savedAgeGroup = saved.ageGroup ? normalizeAgeGroup(saved.ageGroup) : "";
    return {
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
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [profileGames, setProfileGames] = useState([]);
  const [legacyGames, setLegacyGames] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [gamesTab, setGamesTab] = useState("active");
  const [statusToast, setStatusToast] = useState(null);
  const undoStateRef = useRef(null);

  // LEGEND MODAL REFACTOR
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  // Details open state (für "Anzeigen" / "Schließen")
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [ageGroups, setAgeGroups] = useState([]);
  const { location, updateLocation, isLoading } = useUserLocation();

  const normalizedProfileAgeGroups = useMemo(() => {
    if (!Array.isArray(profile?.ageGroups)) return [];
    return Array.from(
      new Set(
        profile.ageGroups
          .map((value) => normalizeAgeGroup(value))
          .filter((value) => typeof value === "string" && value.trim() !== "")
      )
    );
  }, [profile?.ageGroups]);

  const profileDefaultAgeGroup = useMemo(
    () => deriveProfileDefaultAgeGroup(normalizedProfileAgeGroups),
    [normalizedProfileAgeGroups]
  );

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

  useEffect(() => {
    if (!profileDefaultAgeGroup) return;
    setNewGame((prev) => {
      const prevNormalized = normalizeAgeGroup(prev.ageGroup);
      const hasPrev = normalizedProfileAgeGroups.includes(prevNormalized);
      if (!prevNormalized || !hasPrev) {
        return { ...prev, ageGroup: profileDefaultAgeGroup };
      }
      return prev;
    });
  }, [normalizedProfileAgeGroups, profileDefaultAgeGroup]);

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

      const contactEmail = (profile.email || "").trim();
      const contactEmailNormalized = contactEmail.toLowerCase();
      const trainerProfileId = profile.id || contactEmailNormalized || "";
      const trainerEmail = contactEmailNormalized || profile.id || "";

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
        contactEmail,
        contactEmailNormalized,
        contactPhone: profile.phone || "",
        trainerEmail,
        trainerProfileId,
        createdAt: serverTimestamp(),
        // FEATURE 4: Game Status + Undo
        status: "active",
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

  useEffect(() => {
    if (!profile?.id) {
      setGameHistory([]);
      return () => undefined;
    }
    const historyQuery = query(
      collection(db, "game_history"),
      where("trainerId", "==", profile.id),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const entries = [];
      snapshot.forEach((docSnap) => {
        entries.push({ id: docSnap.id, ...docSnap.data() });
      });
      setGameHistory(entries);
    });
    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    if (!statusToast) return () => undefined;
    const timeout = window.setTimeout(() => {
      setStatusToast(null);
      undoStateRef.current = null;
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [statusToast]);

  // FEATURE 4: Game Status + Undo
  const showStatusToast = (gameId, nextStatus, historyId) => {
    setStatusToast({
      message: "Status gespeichert – Rückgängig?",
      actionLabel: "Rückgängig",
      gameId,
      nextStatus,
      historyId,
    });
  };

  const handleUpdateStatus = async (game, nextStatus) => {
    if (!game?.id || !profile?.id) return;
    if (game.status === nextStatus) return;
    try {
      const gameRef = doc(db, "games", game.id);
      const previousStatus = game.status || "active";
      await updateDoc(gameRef, { status: nextStatus });
      const historyRef = await addDoc(collection(db, "game_history"), {
        gameId: game.id,
        status: nextStatus,
        timestamp: serverTimestamp(),
        trainerId: profile.id,
        teamName: game.ownerClub || game.ownerName || "Unbekanntes Team",
      });
      undoStateRef.current = {
        gameId: game.id,
        previousStatus,
        historyId: historyRef.id,
      };
      showStatusToast(game.id, nextStatus, historyRef.id);
    } catch (error) {
      console.error("Spielstatus konnte nicht aktualisiert werden:", error);
      window.alert("Spielstatus konnte nicht gespeichert werden.");
    }
  };

  const handleUndoStatus = async () => {
    const undoState = undoStateRef.current;
    if (!undoState?.gameId) return;
    try {
      const gameRef = doc(db, "games", undoState.gameId);
      await updateDoc(gameRef, { status: undoState.previousStatus || "active" });
      if (undoState.historyId) {
        await deleteDoc(doc(db, "game_history", undoState.historyId));
      }
    } catch (error) {
      console.error("Status konnte nicht zurückgesetzt werden:", error);
      window.alert("Status konnte nicht zurückgesetzt werden.");
    } finally {
      undoStateRef.current = null;
      setStatusToast(null);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Spielgesuch aufgeben</h2>
            <p className="mt-2 text-sm text-slate-600">
              Gib hier die Details deines Freundschaftsspiels ein. Deine Angaben werden fürs nächste mal gespeichert.
              Weiter unten findest Du deine bereits eingestellten Spiele.
              Viel Erfolg bei der Suche!
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

            <div className="space-y-2 text-sm font-medium text-slate-700">
              <label className="flex flex-col space-y-2">
                <span>Teamstärke</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={newGame.strength}
                  onChange={(e) => setNewGame((s) => ({ ...s, strength: e.target.value }))}
                >
                  <option value="">Teamstärke (1–10)</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>

              {/* collapsible legend */}
              <details
                className="group rounded-2xl border border-slate-100 bg-slate-50"
                onToggle={(e) => setIsDetailsOpen(Boolean(e.target.open))}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-sm text-slate-700"
                  aria-expanded={isDetailsOpen}
                >
                  <span className="font-semibold">Teamstärke-Legende</span>
                  <span className="text-xs text-slate-500">
                    {isDetailsOpen ? "Schließen" : "Anzeigen"}
                  </span>
                </summary>
                <div className="px-3 pb-3 pt-0">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                    <div className="whitespace-normal break-words">
                      <TeamStrengthLegend />
                    </div>
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        onClick={() => setIsLegendOpen(true)}
                        className="text-sm text-gray-500 transition hover:underline"
                      >
                        ℹ️ Weitere Details zur Einordnung!
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            </div>

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

      {isLegendOpen && (
        <TeamStrengthModal onClose={() => setIsLegendOpen(false)} />
      )}

      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Meine Spiele</h2>
          <span className="text-xs font-medium text-slate-500">{myGames.length} Einträge</span>
        </div>

        {/* FEATURE 4: Game Status + Undo */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setGamesTab("active")}
            className={clsx(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition",
              gamesTab === "active"
                ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
            )}
          >
            Aktive Spiele
          </button>
          <button
            type="button"
            onClick={() => setGamesTab("history")}
            className={clsx(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition",
              gamesTab === "history"
                ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
            )}
            disabled={gameHistory.length === 0}
          >
            Vergangene Spiele
          </button>
        </div>

        {gamesTab === "active" ? (
          myGames.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Du hast noch keine Spiele angelegt.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {myGames.map((g) => {
                const normalizedGroup = normalizeAgeGroup(g.ageGroup);
                const status = g.status || "active";
                const isInactive = status !== "active";
                const statusLabel =
                  status === "cancelled"
                    ? "Abgesagt"
                    : status === "matched"
                    ? "Matchpartner gefunden"
                    : "";
                return (
                  <li
                    key={g.id}
                    className={clsx(
                      "rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4",
                      isInactive && "opacity-60"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">
                        {formatDateGerman(g.date)} {g.time && `• ${g.time}`} {normalizedGroup && `• ${normalizedGroup}`}
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
                      {statusLabel && (
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(g, "cancelled")}
                        className={clsx(
                          "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition",
                          status === "cancelled"
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                        )}
                        disabled={status === "cancelled"}
                      >
                        Spiel abgesagt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(g, "matched")}
                        className={clsx(
                          "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition",
                          status === "matched"
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                            : "border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
                        )}
                        disabled={status === "matched"}
                      >
                        Matchpartner gefunden
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : gameHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Noch keine Historie vorhanden.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {gameHistory.map((entry) => (
              <li
                key={entry.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600 shadow-sm"
              >
                <p className="font-semibold text-slate-800">{entry.teamName || "Team"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.status === "cancelled" ? "Abgesagt" : "Matchpartner gefunden"}
                  {entry.timestamp?.toDate ? (
                    <>
                      {" • "}
                      {formatDateGerman(entry.timestamp.toDate().toISOString().split("T")[0])}
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-white shadow-xl">
            <span>{statusToast.message}</span>
            <button
              type="button"
              onClick={handleUndoStatus}
              className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Rückgängig
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Kleine Darstellung der Teamstärke-Legende (präsentationell)
function TeamStrengthLegend() {
  return (
    <div>
      <ul className="mt-2 space-y-1">
        <li><strong>1–3:</strong> Anfänger / neu zusammengestellt</li>
        <li><strong>4–6:</strong> Gemischtes Team / durchschnittlich</li>
        <li><strong>7–8:</strong> Erfahren</li>
        <li><strong>9–10:</strong> Wettkampfstark</li>
      </ul>
    </div>
  );
}
