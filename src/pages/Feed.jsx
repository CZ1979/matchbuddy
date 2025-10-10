import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Filter, MapPin, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import FilterSheet from "../components/FilterSheet";
import FAB from "../components/FAB";
import BottomSheet from "../components/layout/BottomSheet";
import { useProfile } from "../hooks/useProfile";
import { useUserLocation } from "../hooks/useUserLocation";
import useGamesQuery from "../hooks/useGamesQuery";
import { formatDateGerman } from "../utils/date";
import { normalizeAgeGroup } from "../utils/ageGroups";
import { buildGoogleMapsRouteUrl } from "../lib/maps";
import { geocodePlace } from "../lib/geocode";
import { buildWhatsAppUrl as buildWhatsappUrl } from "../lib/whatsapp";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const DEFAULT_RADIUS = 25;

const shareGame = async (game) => {
  const date = game.date ? formatDateGerman(game.date) : "bald";
  const text = `${game.ownerClub || "Spiel"} am ${date}${game.city ? ` in ${game.city}` : ""}`;
  const sharePayload = {
    title: "MatchBuddy Spiel",
    text,
    url: typeof window !== "undefined" ? window.location.href : "https://matchbuddy.app",
  };

  // build whatsapp link (supports new object shape and legacy string)
  const waTarget = game?.phone || game?.owner?.phone || game?.ownerPhone || game?.ownerPhoneString;
  const waUrl = buildWhatsappUrl(waTarget);

  try {
    if (navigator.share) {
      await navigator.share(sharePayload);
      return;
    }
  } catch (err) {
    console.error(err);
  }

  if (waUrl) {
    // open WhatsApp web/app
    window.open(waUrl, "_blank", "noopener,noreferrer");
    return;
  }

  window.alert("Teilen wird von diesem Gerät nicht unterstützt.");
};

export default function Feed() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { location: geoLocation, isLoading: isLocating, updateLocation } = useUserLocation(false);

  const [filters, setFilters] = useState({
    radius: DEFAULT_RADIUS,
    manualCity: "",
    location: null,
    locationLabel: "",
  });
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [favoritesMap, setFavoritesMap] = useState({});
  const [filterError, setFilterError] = useState("");
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

  const viewerLocation = useMemo(
    () => filters.location || geoLocation || profile?.location || null,
    [filters.location, geoLocation, profile?.location]
  );

  const { games, isLoading: isLoadingGames, error } = useGamesQuery({
    profile,
    viewerLocation,
    filters,
  });

  const locationLabel = filters.locationLabel || profile?.city || (viewerLocation ? "deinem Standort" : "Deutschland");
  const totalGames = games.length;
  const selectedGameAgeGroup = selectedGame ? normalizeAgeGroup(selectedGame.ageGroup) : "";
  const selectedGameRouteUrl = selectedGame
    ? buildGoogleMapsRouteUrl({ address: selectedGame.address, zip: selectedGame.zip, city: selectedGame.city })
    : "";

  // FEATURE 6: Share Button + Favorites
  useEffect(() => {
    if (!profile?.id) {
      setFavoritesMap({});
      return () => undefined;
    }
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("trainerId", "==", profile.id)
    );
    const unsubscribe = onSnapshot(favoritesQuery, (snapshot) => {
      const map = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data?.gameId) {
          map[data.gameId] = { id: docSnap.id, ...data };
        }
      });
      setFavoritesMap(map);
    });
    return () => unsubscribe();
  }, [profile?.id]);

  const handleToggleFavorite = async (game) => {
    if (!profile?.id) {
      window.alert("Bitte melde dich an, um Favoriten zu speichern.");
      return;
    }
    const existing = favoritesMap[game.id];
    try {
      if (existing) {
        await deleteDoc(doc(db, "favorites", existing.id));
      } else {
        await addDoc(collection(db, "favorites"), {
          trainerId: profile.id,
          gameId: game.id,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Favorit konnte nicht aktualisiert werden:", error);
      window.alert("Favorit konnte nicht gespeichert werden.");
    }
  };

  const handleApplyFilters = async (next) => {
    const manualCity = (next.manualCity || "").trim();
    setFilterError("");

    if (manualCity) {
      setIsGeocodingLocation(true);
      const geo = await geocodePlace(manualCity);
      setIsGeocodingLocation(false);
      const hasGeo = typeof geo.lat === "number" && typeof geo.lng === "number";
      setFilters((prev) => ({
        ...prev,
        ...next,
        manualCity,
        location: hasGeo ? geo : prev.location,
        locationLabel: hasGeo ? manualCity : prev.locationLabel,
      }));
      if (!hasGeo) {
        setFilterError("Der eingegebene Ort konnte nicht gefunden werden.");
      }
      return;
    }

    setFilters((prev) => ({
      ...prev,
      ...next,
      manualCity: "",
      location: null,
      locationLabel: "",
    }));
  };

  const handleResetFilters = () => {
    setFilterError("");
    setFilters({
      radius: DEFAULT_RADIUS,
      manualCity: "",
      location: null,
      locationLabel: "",
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Spiele in deiner Nähe</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={16} className="text-emerald-500" /> Basierend auf deinem Ort: {locationLabel}
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-600">
              {isLoadingGames
                ? "Spiele werden geladen…"
                : totalGames === 0
                ? "Keine Spiele gefunden"
                : totalGames === 1
                ? "1 Spiel gefunden"
                : `${totalGames} Spiele gefunden`}
            </p>
            {!viewerLocation && (
              <button
                type="button"
                onClick={updateLocation}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
              >
                <RefreshCcw size={14} /> Standort aktivieren
              </button>
            )}
            {isLocating && (
              <p className="mt-2 text-xs text-slate-500">Standort wird ermittelt…</p>
            )}
            {isGeocodingLocation && (
              <p className="mt-2 text-xs text-slate-500">Eingegebener Ort wird gesucht…</p>
            )}
            {filterError && (
              <p className="mt-2 text-xs text-red-600">{filterError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
          >
            <Filter size={16} /> Filter
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Spiele konnten nicht geladen werden. Bitte versuche es später erneut.
        </div>
      )}

      {isLoadingGames ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-60 animate-pulse rounded-3xl bg-white/60 shadow-inner" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow">
          Keine Spiele gefunden. Passe deine Filter an oder erweitere den Umkreis.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                viewerProfile={profile}
                onDetails={setSelectedGame}
                isSaved={Boolean(favoritesMap[game.id])}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={Boolean(favoritesMap[game.id])}
                onShare={shareGame}
              />
            ))}
          </div>
        </>
      )}

      <FilterSheet
        open={isFilterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <BottomSheet
        open={Boolean(selectedGame)}
        onClose={() => setSelectedGame(null)}
        title={selectedGame ? selectedGame.ownerClub || "Spiel-Details" : "Spiel-Details"}
      >
        {selectedGame && (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="space-y-2">
              <p>
                <strong>Datum:</strong> {selectedGame.date ? formatDateGerman(selectedGame.date) : "tba"}
              </p>
              {selectedGame.time && (
                <p>
                  <strong>Uhrzeit:</strong> {selectedGame.time}
                </p>
              )}
              {selectedGameAgeGroup && (
                <p>
                  <strong>Altersklasse:</strong> {selectedGameAgeGroup}
                </p>
              )}
              <p>
                <strong>Trainer:</strong> {selectedGame.ownerName || "Nicht angegeben"}
              </p>
            </div>
            {(selectedGame.address || selectedGame.city) && (
              <div className="space-y-2">
                <p>
                  <strong>Ort:</strong> {[selectedGame.address, selectedGame.zip, selectedGame.city].filter(Boolean).join(", ")}
                </p>
                {selectedGameRouteUrl && (
                  <a
                    href={selectedGameRouteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <ExternalLink size={14} /> Route in Google Maps öffnen
                  </a>
                )}
              </div>
            )}
            {selectedGame.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Hinweise</p>
                <p className="mt-1 rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">{selectedGame.notes}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <FAB onClick={() => navigate("/neues-spiel")} />
    </div>
  );
}
