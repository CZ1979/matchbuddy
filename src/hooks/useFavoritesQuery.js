import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { filterGamesByDistance } from "../utils/RecommendationEngine";

const sortByUpcomingDate = (games) => {
  const toTimestamp = (value) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };
  return [...games].sort((a, b) => {
    const diff = toTimestamp(a.date) - toTimestamp(b.date);
    if (diff !== 0) return diff;
    return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
  });
};

export function useFavoritesQuery({ profile, viewerLocation }) {
  const [favorites, setFavorites] = useState([]);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to favorites collection
  useEffect(() => {
    if (!profile?.id) {
      setFavorites([]);
      setIsLoading(false);
      return () => undefined;
    }

    const favoritesQuery = query(
      collection(db, "favorites"),
      where("trainerId", "==", profile.id)
    );

    const unsubscribe = onSnapshot(
      favoritesQuery,
      (snapshot) => {
        const favoritesList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setFavorites(favoritesList);
      },
      (err) => {
        console.error("Favoriten konnten nicht geladen werden:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.id]);

  // Fetch game details for each favorite
  useEffect(() => {
    if (favorites.length === 0) {
      setGames([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchGames = async () => {
      try {
        const gamePromises = favorites.map(async (favorite) => {
          if (!favorite.gameId) return null;
          const gameRef = doc(db, "games", favorite.gameId);
          const gameSnap = await getDoc(gameRef);
          if (!gameSnap.exists()) return null;
          return { id: gameSnap.id, ...gameSnap.data() };
        });

        const gamesData = await Promise.all(gamePromises);
        if (cancelled) return;

        const validGames = gamesData.filter(Boolean);
        setGames(validGames);
      } catch (err) {
        if (cancelled) return;
        console.error("Spiele konnten nicht geladen werden:", err);
        setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  const enrichedGames = useMemo(() => {
    if (games.length === 0) return [];

    const activeLocation = viewerLocation || profile?.location || null;
    const distanceAware = filterGamesByDistance(games, activeLocation, 999);

    return sortByUpcomingDate(distanceAware);
  }, [games, profile?.location, viewerLocation]);

  return {
    games: enrichedGames,
    isLoading,
    error,
    hasFavorites: favorites.length > 0,
  };
}

export default useFavoritesQuery;
