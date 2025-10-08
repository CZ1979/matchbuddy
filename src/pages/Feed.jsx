import { useEffect, useMemo, useState } from "react";
import { Filter, MapPin, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameCard from "../components/GameCard";
import FilterSheet from "../components/FilterSheet";
import FAB from "../components/FAB";
import BottomSheet from "../components/layout/BottomSheet";
import { useProfile } from "../hooks/useProfile";
import { useUserLocation } from "../hooks/useUserLocation";
import useGamesQuery from "../hooks/useGamesQuery";
import { formatDateGerman } from "../utils/date";

const DEFAULT_RADIUS = 25;

const loadSavedGameIds = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(localStorage.getItem("savedGames") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Merkliste konnte nicht geladen werden:", error);
    return [];
  }
};

const persistSavedGameIds = (ids) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("savedGames", JSON.stringify(ids));
  } catch (error) {
    console.warn("Merkliste konnte nicht gespeichert werden:", error);
  }
};

const shareGame = async (game) => {
  const date = game.date ? formatDateGerman(game.date) : "bald";
  const text = `${game.ownerClub || "Spiel"} am ${date}${game.city ? ` in ${game.city}` : ""}`;
  const sharePayload = {
    title: "MatchBuddy Spiel",
    text,
    url: typeof window !== "undefined" ? window.location.href : "https://matchbuddy.app",
  };

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(sharePayload);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} – ${sharePayload.url}`);
      window.alert("Link in Zwischenablage kopiert");
      return;
    }
  } catch (error) {
    console.warn("Teilen fehlgeschlagen:", error);
  }
  window.alert("Teilen wird von diesem Gerät nicht unterstützt.");
};

export default function Feed() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { location: geoLocation, isLoading: isLocating, updateLocation } = useUserLocation(false);

  const [filters, setFilters] = useState({
    date: "",
    ageGroup: profile?.ageGroup || "",
    radius: DEFAULT_RADIUS,
  });
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [savedIds, setSavedIds] = useState(loadSavedGameIds);

  const viewerLocation = useMemo(() => geoLocation || profile?.location || null, [geoLocation, profile?.location]);

  const { games, isLoading: isLoadingGames, error } = useGamesQuery({
    profile,
    viewerLocation,
    filters,
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ageGroup: profile?.ageGroup || "" }));
  }, [profile?.ageGroup]);

  const locationLabel = profile?.city || (viewerLocation ? "deinem Standort" : "Deutschland");

  const handleCardAction = async (action, game) => {
    if (!game) return;
    switch (action) {
      case "save": {
        setSavedIds((prev) => {
          const next = prev.includes(game.id)
            ? prev.filter((id) => id !== game.id)
            : [...prev, game.id];
          persistSavedGameIds(next);
          return next;
        });
        break;
      }
      case "share":
        await shareGame(game);
        break;
      case "report": {
        const subject = encodeURIComponent(`Spiel melden – ${game.ownerClub || game.id}`);
        const body = encodeURIComponent(
          `Hallo MatchBuddy-Team,%0D%0A%0D%0Aich möchte folgendes Spiel melden:%0D%0AID: ${game.id}%0D%0AVerein: ${game.ownerClub || "unbekannt"}.`
        );
        window.open(`mailto:support@matchbuddy.app?subject=${subject}&body=${body}`);
        break;
      }
      default:
        break;
    }
  };

  const handleApplyFilters = (next) => {
    setFilters(next);
  };

  const handleResetFilters = () => {
    setFilters({ date: "", ageGroup: profile?.ageGroup || "", radius: DEFAULT_RADIUS });
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
        <div className="grid gap-6 sm:grid-cols-2">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              viewerProfile={profile}
              onDetails={setSelectedGame}
              onAction={handleCardAction}
              isSaved={savedIds.includes(game.id)}
            />
          ))}
        </div>
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
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>Datum:</strong> {selectedGame.date ? formatDateGerman(selectedGame.date) : "tba"}
            </p>
            {selectedGame.time && (
              <p>
                <strong>Uhrzeit:</strong> {selectedGame.time}
              </p>
            )}
            {selectedGame.city && (
              <p>
                <strong>Ort:</strong> {selectedGame.city}
              </p>
            )}
            {selectedGame.notes && (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">{selectedGame.notes}</p>
            )}
            <p>
              <strong>Trainer:</strong> {selectedGame.ownerName || "Nicht angegeben"}
            </p>
          </div>
        )}
      </BottomSheet>

      <FAB onClick={() => navigate("/neues-spiel")} />
    </div>
  );
}
