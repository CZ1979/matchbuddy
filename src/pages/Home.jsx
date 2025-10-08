import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { User, Trophy, MapPin } from "lucide-react";
import { db } from "../firebase";
import { useUserLocation } from "../hooks/useUserLocation";
import GameCarousel from "../components/GameCarousel";
import { filterGamesByDistance, getRecommendedGames } from "../utils/RecommendationEngine";

const readProfileFromStorage = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("trainerProfile") || "{}");
  } catch (error) {
    console.warn("Profil konnte nicht geladen werden:", error);
    return {};
  }
};

const readTrainerEmail = () => (typeof window === "undefined" ? "" : localStorage.getItem("trainerEmail") || "");

export default function Home() {
  const navigate = useNavigate();
  const { location, isLoading, updateLocation } = useUserLocation(true);

  const [trainerProfile, setTrainerProfile] = useState(() => readProfileFromStorage());
  const trainerEmail = trainerProfile?.email || readTrainerEmail();
  const hasProfile = Boolean(trainerEmail);

  const [recommendedGames, setRecommendedGames] = useState([]);
  const [latestGames, setLatestGames] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const sync = () => {
      setTrainerProfile(readProfileFromStorage());
    };

    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    sync();

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  useEffect(() => {
    if (!hasProfile) {
      setRecommendedGames([]);
    }
  }, [hasProfile]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;

    const fetchGames = async () => {
      setIsFetching(true);
      setLoadError("");
      try {
        const baseQuery = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(30));
        const snapshot = await getDocs(baseQuery);
        const docs = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? null,
          };
        });

        const today = new Date().toISOString().split("T")[0];
        const upcoming = docs.filter((game) => !game.date || game.date >= today);
        const baseGames = upcoming.length > 0 ? upcoming : docs;

        let recommended = [];
        if (hasProfile && trainerEmail) {
          const ownQuery = query(
            collection(db, "games"),
            where("trainerEmail", "==", trainerEmail),
            orderBy("createdAt", "desc"),
            limit(20)
          );
          const ownSnapshot = await getDocs(ownQuery);
          const userGames = ownSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

          recommended = getRecommendedGames({
            games: baseGames,
            userGames,
            userLocation: location,
            maxResults: 6,
          });
        }

        const recommendedIds = new Set(recommended.map((game) => game.id));
        const distanceFiltered = filterGamesByDistance(baseGames, location, 30);

        let latest = distanceFiltered.filter((game) => !recommendedIds.has(game.id)).slice(0, 6);
        if (latest.length === 0) {
          latest = baseGames.filter((game) => !recommendedIds.has(game.id)).slice(0, 6);
        }

        if (!cancelled) {
          setRecommendedGames(hasProfile ? recommended : []);
          setLatestGames(latest);
        }
      } catch (error) {
        console.error("Spiele konnten nicht geladen werden:", error);
        if (!cancelled) setLoadError("Spiele konnten nicht geladen werden. Bitte versuche es erneut.");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [location, isLoading, trainerEmail, hasProfile]);

  const latestSubtitle = location
    ? "Spiele im Umkreis von 30 km"
    : "Wir zeigen dir die neuesten Spiele – aktiviere Standort, um Spiele in deiner Nähe zu sehen.";

  const showRecommended = hasProfile && recommendedGames.length > 0;
  const carouselGames = showRecommended ? recommendedGames : latestGames;
  const carouselTitle = showRecommended
    ? "🧭 Diese Spiele passen zu deinem Profil"
    : "✳️ Neueste Spiele in deiner Nähe";
  const carouselSubtitle = showRecommended
    ? "Basierend auf deinen bisherigen Spielen"
    : latestSubtitle;

  const handleNewGameClick = () => {
    if (!hasProfile) return;
    navigate("/neues-spiel");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4">
      <section className="rounded-2xl bg-base-100 p-8 text-center shadow">
        <h1 className="font-heading text-4xl text-primary">Find your Match!</h1>
        <p className="py-4 text-base-content/70">
          Du suchst nach Gegnern für Freundschaftsspiele – ohne WhatsApp-Chaos?
          <br />
          Hier bist Du richtig!
        </p>
        {isLoading && <p className="text-xs text-neutral-500">📍 Standort wird geladen…</p>}
        {location && (
          <p className="text-xs text-neutral-500">
            📍 Standort aktiv (ca. {Math.round(location.lat * 100) / 100}, {" "}
            {Math.round(location.lng * 100) / 100})
          </p>
        )}
        {!isLoading && !location && (
          <button type="button" onClick={updateLocation} className="btn btn-sm btn-outline mt-4">
            Standort aktivieren
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Link
          to="/profil"
          className="rounded-2xl border border-base-200 bg-base-100 p-6 text-center shadow transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <User className="mx-auto text-primary" size={40} />
          <h2 className="mt-3 text-lg font-semibold">Mein Profil</h2>
          <p className="mb-3 text-base-content/70">Trainerprofil mit Verein &amp; Kontakt</p>
          <span className="btn btn-primary">Öffnen</span>
        </Link>

        <div
          className={`rounded-2xl border border-base-200 bg-base-100 p-6 text-center shadow transition ${
            hasProfile ? "hover:-translate-y-0.5 hover:shadow-xl" : "opacity-60"
          }`}
        >
          <Trophy className="mx-auto text-primary" size={40} />
          <h2 className="mt-3 text-lg font-semibold">Meine Spiele</h2>
          <p className="mb-3 text-base-content/70">Spiele anlegen und verwalten</p>
          <button
            type="button"
            onClick={handleNewGameClick}
            disabled={!hasProfile}
            className="btn btn-primary"
          >
            Spiel anlegen
          </button>
          {!hasProfile && (
            <div className="mt-4 space-y-1 text-sm">
              <p className="text-warning">⚠️ Bitte lege zuerst dein Profil an, um Spiele zu erstellen.</p>
              <Link to="/profil" className="link link-primary">
                Profil jetzt anlegen
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/spiele"
          className="rounded-2xl border border-base-200 bg-base-100 p-6 text-center shadow transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <MapPin className="mx-auto text-primary" size={40} />
          <h2 className="mt-3 text-lg font-semibold">Spiele suchen</h2>
          <p className="mb-3 text-base-content/70">Finde Spiele im Umkreis</p>
          <span className="btn btn-primary">Suchen</span>
        </Link>
      </section>

      <section className="space-y-6">
        {loadError && <p className="text-sm text-error">{loadError}</p>}

        {isFetching && carouselGames.length === 0 ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-base-300" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[0, 1].map((key) => (
                <div key={key} className="h-48 animate-pulse rounded-2xl bg-base-200" />
              ))}
            </div>
          </div>
        ) : (
          <GameCarousel
            title={carouselTitle}
            subtitle={carouselSubtitle}
            games={carouselGames}
            viewerProfile={trainerProfile}
            viewerLocation={location}
          />
        )}

        <div className="flex justify-center">
          <Link to="/spiele" className="btn btn-outline btn-primary">
            Alle Spiele anzeigen
          </Link>
        </div>
      </section>
    </div>
  );
}
