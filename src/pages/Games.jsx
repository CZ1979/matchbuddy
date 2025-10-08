import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Search } from "lucide-react";
import { useUserLocation } from "../hooks/useUserLocation";
import GameCard from "../components/GameCard";
import { generateAgeGroups, normalizeAgeGroup } from "../utils/ageGroups";
import { calculateDistanceKm } from "../utils/distance";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    setAgeGroups(generateAgeGroups());
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
      if (filter.ageGroup) {
        const ageGroupValue = normalizeAgeGroup(g.ageGroup);
        if (ageGroupValue !== filter.ageGroup) return false;
      }
      const strengthNum = Number(g.strength);
      if (!Number.isNaN(strengthNum) && strengthNum < filter.minStrength) return false;

      if (center && typeof center.lat === "number" && typeof center.lng === "number") {
        if (g.lat == null || g.lng == null) return false;
        const lat = typeof g.lat === "number" ? g.lat : Number(g.lat);
        const lng = typeof g.lng === "number" ? g.lng : Number(g.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        const dist = calculateDistanceKm(center.lat, center.lng, lat, lng);
        if (dist == null || dist > filter.radius) return false;
      }
      return true;
    });
  }, [games, filter, center]);

  useEffect(() => {
    if (!highlightId || typeof window === "undefined") return undefined;
    const timeout = window.setTimeout(() => {
      const el = document.getElementById(`game-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [highlightId, filtered]);

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

          <div className="grid gap-4">
            {filtered.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                viewerProfile={trainerProfile}
                viewerLocation={center}
                anchorId={`game-${g.id}`}
                isHighlighted={highlightId === g.id}
                showDetailsButton={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
