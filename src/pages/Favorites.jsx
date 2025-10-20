import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import GameCard from "../components/GameCard";
import BottomSheet from "../components/layout/BottomSheet";
import { useProfile } from "../hooks/useProfile";
import { useUserLocation } from "../hooks/useUserLocation";
import useFavoritesQuery from "../hooks/useFavoritesQuery";
import { isHighlySimilar } from "../utils/RecommendationEngine";
import { formatDateGerman } from "../utils/date";
import { normalizeAgeGroup } from "../utils/ageGroups";
import { buildGoogleMapsRouteUrl } from "../lib/maps";
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
import useGamesQuery from "../hooks/useGamesQuery";

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

export default function Favorites() {
  const { profile } = useProfile();
  const { location: geoLocation } = useUserLocation(false);

  const [selectedGame, setSelectedGame] = useState(null);
  const [favoritesMap, setFavoritesMap] = useState({});

  const viewerLocation = useMemo(
    () => geoLocation || profile?.location || null,
    [geoLocation, profile?.location]
  );

  const { games, isLoading: isLoadingGames, error } = useFavoritesQuery({
    profile,
    viewerLocation,
  });

  // Get user games for similarity check
  const { userGames } = useGamesQuery({
    profile,
    viewerLocation,
    filters: {},
  });

  const totalGames = games.length;
  const selectedGameAgeGroup = selectedGame ? normalizeAgeGroup(selectedGame.ageGroup) : "";
  const selectedGameRouteUrl = selectedGame
    ? buildGoogleMapsRouteUrl({ address: selectedGame.address, zip: selectedGame.zip, city: selectedGame.city })
    : "";

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

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-3xl bg-white p-6 shadow-lg shadow-emerald-100/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <Star size={24} className="text-emerald-500" />
              Meine Favoriten
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Alle von dir gespeicherten Spiele auf einen Blick
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-600">
              {isLoadingGames
                ? "Favoriten werden geladen…"
                : totalGames === 0
                ? "Keine Favoriten gespeichert"
                : totalGames === 1
                ? "1 Favorit gespeichert"
                : `${totalGames} Favoriten gespeichert`}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Favoriten konnten nicht geladen werden. Bitte versuche es später erneut.
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
          Noch keine Favoriten gespeichert. Markiere Spiele im Feed als Favoriten, um sie hier zu sehen.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {games.map((game) => {
              const similar = isHighlySimilar(game, profile, userGames || [], viewerLocation);
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  viewerProfile={profile}
                  onDetails={setSelectedGame}
                  isSaved={Boolean(favoritesMap[game.id])}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={Boolean(favoritesMap[game.id])}
                  onShare={shareGame}
                  isHighlySimilar={similar}
                />
              );
            })}
          </div>
        </>
      )}

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
    </div>
  );
}
