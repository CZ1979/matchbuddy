import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { filterGamesByDistance, getRecommendedGames } from "../utils/RecommendationEngine";
import { normalizeAgeGroup } from "../utils/ageGroups";

const upcomingGames = (games) => {
  if (!Array.isArray(games)) return [];
  const today = new Date().toISOString().split("T")[0];
  const futureGames = games.filter((game) => !game.date || game.date >= today);
  return futureGames.length > 0 ? futureGames : games;
};

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

const applyFilters = (games, filters = {}) => {
  if (!Array.isArray(games)) return [];
  const { date = "", ageGroup = "", location = null, radius = 25 } = filters;

  return games.filter((game) => {
    if (date && game.date && game.date < date) return false;
    if (ageGroup) {
      const normalized = normalizeAgeGroup(game.ageGroup);
      if (normalized !== ageGroup) return false;
    }
    if (location && typeof location.lat === "number" && typeof location.lng === "number") {
      if (typeof game.distanceKm === "number" && Number.isFinite(game.distanceKm)) {
        if (game.distanceKm > radius) return false;
      }
    }
    return true;
  });
};

const mergeRecommended = (recommended, base) => {
  const unique = [];
  const seen = new Set();
  recommended.forEach((game) => {
    if (!seen.has(game.id)) {
      unique.push(game);
      seen.add(game.id);
    }
  });
  base.forEach((game) => {
    if (!seen.has(game.id)) {
      unique.push(game);
      seen.add(game.id);
    }
  });
  return unique;
};

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

<<<<<<< HEAD
const matchesOwnEmail = (game, ownEmails) => {
  if (!game || !ownEmails || ownEmails.size === 0) return false;
  const candidates = [
    game.contactEmail,
    game.trainerEmail,
    game.ownerEmail,
    game.email,
  ];
  return candidates.some((value) => {
    if (!value || typeof value !== "string") return false;
    return ownEmails.has(value.trim().toLowerCase());
  });
};

=======
>>>>>>> relaunch-ux-cards
export function useGamesQuery({ profile, viewerLocation, filters = {} }) {
  const [games, setGames] = useState([]);
  const [profileGames, setProfileGames] = useState([]);
  const [legacyGames, setLegacyGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchGames() {
      setIsLoading(true);
      setError(null);
      try {
        const baseQuery = query(collection(db, "games"), orderBy("createdAt", "desc"), limit(60));
        const snapshot = await getDocs(baseQuery);
        if (cancelled) return;
        setGames(upcomingGames(mapSnapshotDocs(snapshot)));
      } catch (err) {
        if (cancelled) return;
        console.error("Spiele konnten nicht geladen werden:", err);
        setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchGames();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) {
      setProfileGames([]);
      return () => undefined;
    }
    const profileId = profile.id;
    const q = query(collection(db, "games"), where("trainerProfileId", "==", profileId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProfileGames(mapSnapshotDocs(snapshot));
    });
    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setLegacyGames([]);
      return () => undefined;
    }
    let cancelled = false;
    const fetchLegacy = async () => {
      try {
        const legacyQuery = query(collection(db, "games"), where("trainerEmail", "==", profile.id));
        const snapshot = await getDocs(legacyQuery);
        if (cancelled) return;
        setLegacyGames(mapSnapshotDocs(snapshot));
      } catch (legacyError) {
        console.warn("Legacy Spiele konnten nicht geladen werden:", legacyError);
      }
    };
    fetchLegacy();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const combinedUserGames = useMemo(() => {
    const map = new Map();
    [...profileGames, ...legacyGames].forEach((game) => {
      if (!map.has(game.id)) {
        map.set(game.id, game);
      }
    });
    return Array.from(map.values());
  }, [legacyGames, profileGames]);

<<<<<<< HEAD
  const ownEmails = useMemo(() => {
    const list = [];
    if (profile?.email) list.push(profile.email.trim().toLowerCase());
    if (profile?.id) list.push(String(profile.id).trim().toLowerCase());
    return new Set(list.filter(Boolean));
  }, [profile?.email, profile?.id]);

=======
>>>>>>> relaunch-ux-cards
  const activeLocation = useMemo(() => {
    if (viewerLocation && typeof viewerLocation.lat === "number") return viewerLocation;
    if (profile?.location && typeof profile.location.lat === "number") {
      return profile.location;
    }
    return null;
  }, [profile?.location, viewerLocation]);

  const enrichedGames = useMemo(() => {
    if (games.length === 0) return [];
    const ownIds = new Set(combinedUserGames.map((game) => game.id));
    const distanceAware = filterGamesByDistance(games, activeLocation, filters.radius || 25);
    const recommended = profile
      ? getRecommendedGames({
          games: distanceAware,
          userGames: combinedUserGames,
          userLocation: activeLocation,
          maxResults: 8,
        })
      : [];
    const filteredRecommended = applyFilters(recommended, {
      ...filters,
      location: activeLocation,
<<<<<<< HEAD
    }).filter((game) => !ownIds.has(game.id) && !matchesOwnEmail(game, ownEmails));
    const filteredBase = applyFilters(distanceAware, {
      ...filters,
      location: activeLocation,
    }).filter((game) => !ownIds.has(game.id) && !matchesOwnEmail(game, ownEmails));
    return sortByUpcomingDate(mergeRecommended(filteredRecommended, filteredBase));
  }, [activeLocation, combinedUserGames, filters, games, ownEmails, profile]);
=======
    }).filter((game) => !ownIds.has(game.id));
    const filteredBase = applyFilters(distanceAware, {
      ...filters,
      location: activeLocation,
    }).filter((game) => !ownIds.has(game.id));
    return sortByUpcomingDate(mergeRecommended(filteredRecommended, filteredBase));
  }, [activeLocation, combinedUserGames, filters, games, profile]);
>>>>>>> relaunch-ux-cards

  return {
    games: enrichedGames,
    isLoading,
    error,
    location: activeLocation,
  };
}

export default useGamesQuery;
