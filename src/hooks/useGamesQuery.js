import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { filterGamesByDistance, getRecommendedGames } from "../utils/RecommendationEngine";
import { normalizeAgeGroup } from "../utils/ageGroups";

const upcomingGames = (games) => {
  if (!Array.isArray(games)) return [];
  const activeGames = games.filter((game) => !game.status || game.status === "active");
  const today = new Date().toISOString().split("T")[0];
  const futureGames = activeGames.filter((game) => !game.date || game.date >= today);
  return futureGames.length > 0 ? futureGames : activeGames;
};

const mapSnapshotDocs = (snapshot) =>
  snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

const applyFilters = (games, filters = {}) => {
  if (!Array.isArray(games)) return [];
  const { ageGroups = [], location = null, radius = 25 } = filters;

  return games.filter((game) => {
    if (Array.isArray(ageGroups) && ageGroups.length > 0) {
      const normalized = normalizeAgeGroup(game.ageGroup || game.displayAgeGroup || game.originalAgeGroup);
      if (!normalized || !ageGroups.includes(normalized)) return false;
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

export function useGamesQuery({ profile, viewerLocation, filters = {} }) {
  const [rawGames, setRawGames] = useState([]);
  const [profileGames, setProfileGames] = useState([]);
  const [legacyGames, setLegacyGames] = useState([]);
  const [emailGames, setEmailGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchInitialGames() {
      setIsLoading(true);
      setError(null);
      try {
        const collectionRef = collection(db, "games");
        const initialQuery = query(collectionRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(initialQuery);
        if (cancelled) return;
        const docs = mapSnapshotDocs(snapshot);
        setRawGames(docs);
      } catch (err) {
        if (cancelled) return;
        console.error("Spiele konnten nicht geladen werden:", err);
        setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchInitialGames();
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

  useEffect(() => {
    const normalizedEmail = profile?.emailNormalized || profile?.email?.trim().toLowerCase() || "";
    if (!normalizedEmail) {
      setEmailGames([]);
      return () => undefined;
    }
    const q = query(collection(db, "games"), where("trainerEmail", "==", normalizedEmail));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmailGames(mapSnapshotDocs(snapshot));
    });
    return () => unsubscribe();
  }, [profile?.email, profile?.emailNormalized]);

  const combinedUserGames = useMemo(() => {
    const map = new Map();
    [...profileGames, ...legacyGames, ...emailGames].forEach((game) => {
      if (!map.has(game.id)) {
        map.set(game.id, game);
      }
    });
    return Array.from(map.values());
  }, [emailGames, legacyGames, profileGames]);

  const activeLocation = useMemo(() => {
    if (viewerLocation && typeof viewerLocation.lat === "number") return viewerLocation;
    if (profile?.location && typeof profile.location.lat === "number") {
      return profile.location;
    }
    return null;
  }, [profile?.location, viewerLocation]);

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

  const enrichedGames = useMemo(() => {
    if (rawGames.length === 0) return [];
    const upcoming = upcomingGames(rawGames);
    const ownIds = new Set(combinedUserGames.map((game) => game.id));
    const ownEmails = new Set();
    combinedUserGames.forEach((game) => {
      if (typeof game.contactEmail === "string") {
        ownEmails.add(game.contactEmail.trim().toLowerCase());
      }
      if (typeof game.contactEmailNormalized === "string") {
        ownEmails.add(game.contactEmailNormalized.trim().toLowerCase());
      }
      if (typeof game.trainerEmail === "string") {
        ownEmails.add(game.trainerEmail.trim().toLowerCase());
      }
    });
    const normalizedProfileEmail = profile?.emailNormalized || profile?.email?.trim().toLowerCase() || "";
    if (normalizedProfileEmail) {
      ownEmails.add(normalizedProfileEmail);
    }
    const isOwnGame = (game) => {
      if (!game) return false;
      if (ownIds.has(game.id)) return true;
      const contactEmail = typeof game.contactEmail === "string" ? game.contactEmail.trim().toLowerCase() : "";
      if (contactEmail && ownEmails.has(contactEmail)) return true;
      const contactEmailNormalized =
        typeof game.contactEmailNormalized === "string" ? game.contactEmailNormalized.trim().toLowerCase() : "";
      if (contactEmailNormalized && ownEmails.has(contactEmailNormalized)) return true;
      const trainerEmail = typeof game.trainerEmail === "string" ? game.trainerEmail.trim().toLowerCase() : "";
      if (trainerEmail && ownEmails.has(trainerEmail)) return true;
      return false;
    };
    const distanceAware = filterGamesByDistance(upcoming, activeLocation, filters.radius || 25);
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
      ageGroups: normalizedProfileAgeGroups,
    }).filter((game) => !isOwnGame(game));
    const filteredBase = applyFilters(distanceAware, {
      ...filters,
      location: activeLocation,
      ageGroups: normalizedProfileAgeGroups,
    }).filter((game) => !isOwnGame(game));
    return sortByUpcomingDate(mergeRecommended(filteredRecommended, filteredBase));
  }, [activeLocation, combinedUserGames, filters, normalizedProfileAgeGroups, profile, rawGames]);

  return {
    games: enrichedGames,
    isLoading,
    error,
    location: activeLocation,
    userGames: combinedUserGames,
  };
}

export default useGamesQuery;
