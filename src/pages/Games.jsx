import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Mail, MapPin, Star, Navigation, Crosshair, MessageCircle } from "lucide-react";

// 📅 Datum ins deutsche Format
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

// 🔢 Distanzberechnung (Haversine)
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function Games() {
  const [games, setGames] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [filter, setFilter] = useState({
    ageGroup: "",
    radius: 50,
    locationQuery: "",
  });
  const [center, setCenter] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // 🧮 Jahrgänge U6–U21 (Dropdown mit Label + Value)
  useEffect(() => {
    const year = new Date().getFullYear();
    const list = [];
    for (let u = 6; u <= 21; u++) {
      const birthYear = year - u;
      list.push({ label: `U${u} / ${birthYear}`, value: `U${u}` });
    }
    setAgeGroups(list);
  }, []);

  // 🔥 Firestore Live Sync
  useEffect(() => {
    const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

      // Nur zukünftige Spiele
      const today = new Date().toISOString().split("T")[0];
      const upcoming = list.filter((g) => g.date && g.date >= today);

      // Nach Datum aufsteigend sortieren
      upcoming.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
      setGames(upcoming);
    });
    return () => unsub();
  }, []);

  // 🧭 Filter (Jahrgang + Radius)
  const filtered = useMemo(() => {
    return games.filter((g) => {
      // Jahrgang: nur nach dem ersten Teil (U11 etc.) vergleichen
      if (filter.ageGroup && !g.ageGroup?.startsWith(filter.ageGroup)) return false;

      // Radiusfilter
      if (center && typeof g.lat === "number" && typeof g.lng === "number") {
        const d = distanceKm(center.lat, center.lng, g.lat, g.lng);
        if (d > filter.radius) return false;
      } else if (center && (g.lat == null || g.lng == null)) {
        return false;
      }
      return true;
    });
  }, [games, filter, center]);

  // 📍 Geocoding
  const geocode = async (queryStr) => {
    if (!queryStr?.trim()) return;
    try {
      setIsGeocoding(true);
      const res = await fetch(
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
          encodeURIComponent(queryStr)
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        setCenter({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          label: item.display_name,
        });
      } else {
        alert("Ort nicht gefunden. Bitte präziser eingeben.");
      }
    } catch (e) {
      console.error("Geocoding fehlgeschlagen:", e);
      alert("Geocoding fehlgeschlagen.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // 📍 Mein Standort
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation wird nicht unterstützt.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Mein Standort",
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn(err);
        alert("Standort konnte nicht ermittelt werden.");
        setIsLocating(false);
      }
    );
  };

  // 🌟 Stärke
  const renderStrength = (level) => {
    const l = parseInt(level || 0, 10);
    return (
      <div className="flex gap-0.5 mt-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i + 1 <= l ? "text-yellow-500 fill-yellow-500" : "text-base-300"}
          />
        ))}
      </div>
    );
  };

  // 🗺️ Google Maps Route-Link
  const routeHref = (g) => {
    if (typeof g.lat === "number" && typeof g.lng === "number") {
      return `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`;
    }
    const parts = [g.address, g.zip, g.city].filter(Boolean).join(", ");
    if (parts) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts)}`;
    }
    return null;
  };

  // 📱 WhatsApp Nachricht
  const whatsappMessage = (g) => {
    const date = formatDateGerman(g.date);
    return encodeURIComponent(
      `Hallo! Sucht ihr noch einen Gegner für euer Spiel am ${date}? Wir hätten Interesse!`
    );
  };

  return (
    <div className="p-4">
      {/* Filter */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-primary">Spiele suchen</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mt-2">
            {/* Jahrgang */}
            <select
              className="select select-bordered w-full"
              value={filter.ageGroup}
              onChange={(e) => setFilter((s) => ({ ...s, ageGroup: e.target.value }))}
            >
              <option value="">Alle Jahrgänge</option>
              {ageGroups.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>

            {/* Standort */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ort / Adresse für Umkreissuche"
                className="input input-bordered w-full"
                value={filter.locationQuery}
                onChange={(e) => setFilter((s) => ({ ...s, locationQuery: e.target.value }))}
              />
              <button
                className="btn btn-outline"
                onClick={() => geocode(filter.locationQuery)}
                disabled={isGeocoding}
              >
                {isGeocoding ? "…" : "Setzen"}
              </button>
            </div>

            {/* Radius */}
            <select
              className="select select-bordered w-full"
              value={filter.radius}
              onChange={(e) => setFilter((s) => ({ ...s, radius: parseInt(e.target.value) }))}
            >
              {[10, 25, 50, 75, 100].map((r) => (
                <option key={r} value={r}>
                  {r} km Umkreis
                </option>
              ))}
            </select>

            {/* Aktionen */}
            <div className="flex gap-2">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setFilter({ ageGroup: "", radius: 50, locationQuery: "" });
                  setCenter(null);
                }}
              >
                Reset
              </button>
              <button className="btn btn-primary" onClick={useMyLocation} disabled={isLocating}>
                <Crosshair size={16} className="mr-1" />
                {isLocating ? "Suche…" : "Mein Standort"}
              </button>
            </div>
          </div>

          {center && (
            <div className="text-xs text-base-content/60 mt-2">
              Zentrum: <span className="text-base-content">{center.label}</span> • Radius:{" "}
              {filter.radius} km
            </div>
          )}
        </div>
      </div>

      {/* Spieleliste */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-primary mb-3">Gefundene Spiele</h2>

          {filtered.length === 0 && (
            <p className="text-sm text-neutral-500">Keine Spiele gefunden.</p>
          )}

          <ul className="divide-y divide-base-200">
            {filtered.map((g) => {
              const route = routeHref(g);

              // Telefonnummer normalisieren für Anzeige
              let phoneRaw = (g.contactPhone || "").trim();
              let displayPhone = phoneRaw;
              if (displayPhone.startsWith("0049")) displayPhone = "+" + displayPhone.slice(2);
              else if (displayPhone.startsWith("0")) displayPhone = "+49" + displayPhone.slice(1);
              else if (!displayPhone.startsWith("+")) displayPhone = "+" + displayPhone;

              // Für WhatsApp-Link: + MUSS mit in die URL → encoden!
              // Beispiel: https://wa.me/%2B491761234567?text=...
              const phoneForWhatsApp = encodeURIComponent(displayPhone);

              return (
                <li key={g.id} className="py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {formatDateGerman(g.date)} {g.time && `• ${g.time}`}{" "}
                        {g.ageGroup && `• ${g.ageGroup}`}
                      </div>

                      <div className="text-sm text-base-content/80">
                        {g.ownerClub && <span>{g.ownerClub}</span>}
                        {g.ownerName && <span> — {g.ownerName}</span>}
                      </div>

                      {g.notes && (
                        <div className="text-sm italic text-neutral-600 mt-1">{g.notes}</div>
                      )}

                      {(g.address || g.city || g.zip) && (
                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                          <MapPin size={14} className="text-primary" />
                          {[g.address, g.zip, g.city].filter(Boolean).join(", ")}
                        </div>
                      )}

                      {renderStrength(g.strength)}
                    </div>

                    <div className="flex flex-row gap-2 items-start sm:mt-0">
                      {g.contactEmail && (
                        <a
                          href={`mailto:${g.contactEmail}`}
                          className="btn btn-sm btn-primary"
                          title="E-Mail schreiben"
                        >
                          <Mail size={16} />
                        </a>
                      )}
                      {phoneRaw && (
                        <a
                          href={`https://wa.me/${phoneForWhatsApp}?text=${whatsappMessage(g)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-success"
                          title={`WhatsApp öffnen (${displayPhone})`}
                        >
                          <MessageCircle size={16} />
                        </a>
                      )}
                      {route && (
                        <a
                          href={route}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline"
                          title="Route in Google Maps öffnen"
                        >
                          <Navigation size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
