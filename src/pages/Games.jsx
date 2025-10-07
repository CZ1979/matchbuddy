import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Mail, MapPin, Navigation, MessageCircle, Search } from "lucide-react";
import { useUserLocation } from "../hooks/useUserLocation";

function formatDateGerman(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d)
    ? dateStr
    : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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
    radius: 25,
    locationQuery: "",
    minStrength: 1,
  });
  const [center, setCenter] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { location, updateLocation } = useUserLocation(true);
  const trainerProfile = JSON.parse(localStorage.getItem("trainerProfile") || "{}");

  useEffect(() => {
    const year = new Date().getFullYear();
    const list = [];
    for (let u = 6; u <= 21; u++) list.push({ label: `U${u} / ${year - u}`, value: `U${u}` });
    setAgeGroups(list);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      const today = new Date().toISOString().split("T")[0];
      const upcoming = list.filter((g) => g.date && g.date >= today);
      upcoming.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
      setGames(upcoming);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (location && !center) {
      setCenter({ lat: location.lat, lng: location.lng, label: "Mein Standort" });
    }
  }, [location]);

  const handleSearch = async () => {
    const queryStr = filter.locationQuery.trim();
    if (!queryStr) return;
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

  const handleReset = () => {
    setFilter({ ageGroup: "", radius: 25, locationQuery: "", minStrength: 1 });
    updateLocation();
    if (location)
      setCenter({ lat: location.lat, lng: location.lng, label: "Mein Standort" });
  };

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (filter.ageGroup && !g.ageGroup?.startsWith(filter.ageGroup)) return false;
      const strengthNum = Number(g.strength);
      if (!isNaN(strengthNum) && strengthNum < filter.minStrength) return false;

      if (center && typeof g.lat === "number" && typeof g.lng === "number") {
        const d = distanceKm(center.lat, center.lng, g.lat, g.lng);
        if (d > filter.radius) return false;
      } else if (center && (g.lat == null || g.lng == null)) {
        return false;
      }
      return true;
    });
  }, [games, filter, center]);

  const routeHref = (g) => {
    const destination = [g.address, g.zip, g.city].filter(Boolean).join(", ");
    if (destination) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    }
    if (typeof g.lat === "number" && typeof g.lng === "number") {
      return `https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lng}`;
    }
    return null;
  };

  const whatsappMessage = (g) => {
    const date = formatDateGerman(g.date);
    let text = `Hallo! Sucht ihr noch einen Gegner für euer Spiel am ${date}? Wir hätten Interesse!`;
    const first = trainerProfile.firstName || "";
    const last = trainerProfile.lastName || "";
    const club = trainerProfile.club || "";
    const namePart = [first, last].filter(Boolean).join(" ");
    if (namePart || club) {
      text += `\n\nViele Grüße`;
      if (namePart) text += `,\n${namePart}`;
      if (club) text += `\n${club}`;
    }
    return encodeURIComponent(text);
  };

  return (
    <div className="p-4">
      {/* Filter */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body space-y-3">
          <h2 className="card-title text-primary">Spiele suchen</h2>

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

          {/* Stärke-Stepper über volle Breite */}
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-base-content/70">Mindest-Stärke</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setFilter((s) => ({
                    ...s,
                    minStrength: Math.max(1, s.minStrength - 1),
                  }))
                }
                className="btn btn-sm btn-outline btn-square"
              >
                −
              </button>
              <span className="w-8 text-center text-base font-semibold">
                {filter.minStrength}
              </span>
              <button
                type="button"
                onClick={() =>
                  setFilter((s) => ({
                    ...s,
                    minStrength: Math.min(10, s.minStrength + 1),
                  }))
                }
                className="btn btn-sm btn-outline btn-square"
              >
                +
              </button>
            </div>
          </div>

          {/* Ort mit kleinem Such-Button */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ort / Adresse (optional)"
              className="input input-bordered w-full"
              value={filter.locationQuery}
              onChange={(e) => setFilter((s) => ({ ...s, locationQuery: e.target.value }))}
            />
            <button
              className="btn btn-outline"
              onClick={handleSearch}
              disabled={!filter.locationQuery.trim() || isGeocoding}
            >
              <Search size={16} />
            </button>
          </div>

          {/* Radius + Reset */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="select select-bordered flex-1"
              value={filter.radius}
              onChange={(e) => setFilter((s) => ({ ...s, radius: parseInt(e.target.value) }))}
            >
              {[10, 25, 50, 75, 100].map((r) => (
                <option key={r} value={r}>
                  {r} km Umkreis
                </option>
              ))}
            </select>

            <button className="btn btn-outline flex-1 sm:flex-none" onClick={handleReset}>
              Reset
            </button>
          </div>

          {center && (
            <div className="text-xs text-base-content/60 mt-1">
              Zentrum: <span className="text-base-content">{center.label}</span> • Radius:{" "}
              {filter.radius} km
            </div>
          )}
        </div>
      </div>

      {/* Ergebnisse */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h2 className="card-title text-primary">Gefundene Spiele</h2>
            <span className="text-sm text-base-content/70">
              {filtered.length === 1
                ? "1 Spiel gefunden"
                : `${filtered.length} Spiele gefunden`}
            </span>
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-neutral-500">Keine Spiele gefunden.</p>
          )}

          <ul className="divide-y divide-base-200">
            {filtered.map((g) => {
              const phoneRaw = (g.contactPhone || "").trim();
              let displayPhone = phoneRaw;
              if (displayPhone.startsWith("0049")) displayPhone = "+" + displayPhone.slice(2);
              else if (displayPhone.startsWith("0")) displayPhone = "+49" + displayPhone.slice(1);
              else if (!displayPhone.startsWith("+")) displayPhone = "+" + displayPhone;
              const phoneForWhatsApp = encodeURIComponent(displayPhone);
              const route = routeHref(g);

              let distanceText = "";
              if (
                center &&
                typeof g.lat === "number" &&
                typeof g.lng === "number" &&
                typeof center.lat === "number"
              ) {
                const dist = distanceKm(center.lat, center.lng, g.lat, g.lng);
                distanceText = `~${Math.round(dist)} km entfernt`;
              }

              return (
                <li
                  key={g.id}
                  className="py-4 flex flex-col sm:flex-row sm:justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold">
                      {formatDateGerman(g.date)} {g.time && `• ${g.time}`}{" "}
                      {g.ageGroup && `• ${g.ageGroup}`}{" "}
                      {g.strength && (
                        <span className="text-xs text-primary ml-1">
                          💪 Stärke: {g.strength}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-base-content/80">
                      {g.ownerClub && <span>{g.ownerClub}</span>}
                      {g.ownerName && <span> — {g.ownerName}</span>}
                    </div>

                    {(g.address || g.city || g.zip) && (
                      <div className="text-xs text-neutral-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-primary" />
                          {[g.address, g.zip, g.city].filter(Boolean).join(", ")}
                        </div>
                        {distanceText && (
                          <span className="text-xs text-neutral-500 sm:ml-2">
                            📍 {distanceText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row gap-2 items-start sm:mt-0">
                    {g.contactEmail && (
                      <a href={`mailto:${g.contactEmail}`} className="btn btn-sm btn-primary">
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
                      >
                        <Navigation size={16} />
                      </a>
                    )}
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
