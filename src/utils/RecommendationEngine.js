// src/utils/RecommendationEngine.js
// Centralised helpers for calculating home-page recommendations.

import { calculateDistanceKm } from "./distance";
import { normalizeAgeGroup } from "./ageGroups";

const BASE_RADIUS_KM = 30;
const MAX_RADIUS_KM = 50;

const hasLocation = (loc) =>
  loc && typeof loc.lat === "number" && typeof loc.lng === "number";

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const deriveTimeScore = (dateStr) => {
  if (!dateStr) return 0.4;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return 0.4;
  const diffDays = (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return 0.3;
  if (diffDays >= 60) return 0.1;
  return 1 - diffDays / 60;
};

const matchesAgeGroup = (gameGroup, userGroup, userStrength) => {
  if (!userGroup) return true;
  if (!gameGroup) return false;
  if (gameGroup === userGroup) return true;

  const gameNum = parseInt(gameGroup, 10);
  const userNum = parseInt(userGroup, 10);
  if (Number.isNaN(gameNum) || Number.isNaN(userNum)) return false;

  if (Math.abs(gameNum - userNum) <= 1) return true;

  const isHighStrength = typeof userStrength === "number" && userStrength >= 7;
  if (isHighStrength && gameNum >= userNum) {
    return true;
  }

  return false;
};

const enrichGame = (game, userLocation) => {
  const lat = toNumberOrNull(game.lat);
  const lng = toNumberOrNull(game.lng);
  const distanceKm = hasLocation(userLocation)
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng)
    : null;

  return {
    ...game,
    normalizedAgeGroup: normalizeAgeGroup(game.ageGroup),
    distanceKm,
  };
};

const deriveUserPreferences = (userGames = []) => {
  const counts = new Map();
  let strengthSum = 0;
  let strengthCount = 0;

  userGames.forEach((game) => {
    const normalized = normalizeAgeGroup(game.ageGroup);
    if (normalized) {
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
    const strength = toNumberOrNull(game.strength);
    if (strength != null) {
      strengthSum += strength;
      strengthCount += 1;
    }
  });

  let preferredAgeGroup = "";
  let maxCount = 0;
  counts.forEach((count, key) => {
    if (count > maxCount) {
      preferredAgeGroup = key;
      maxCount = count;
    }
  });

  return {
    preferredAgeGroup,
    strengthEstimate: strengthCount > 0 ? strengthSum / strengthCount : null,
  };
};

/**
 * Heuristik: prüft, ob ein Spiel sehr gut zu den bisherigen Spielen und dem Profil passt.
 * Kriterien (konfigurierbar): Jahrgang (normalized), Teamstärke und geographische Nähe.
 * Liefert boolean zurück.
 */
export function isHighlySimilar(game, profile = null, userGames = [], userLocation = null) {
  if (!game) return false;

  // enrich game with normalized ageGroup and distance
  const enriched = enrichGame(game, userLocation);

  const preferences = deriveUserPreferences(userGames);

  // age match (reuse matchesAgeGroup logic)
  const gameAge = enriched.normalizedAgeGroup;
  const preferredAge = preferences.preferredAgeGroup || (Array.isArray(profile?.ageGroups) && profile.ageGroups[0]) || "";
  const ageMatch = matchesAgeGroup(gameAge, preferredAge, preferences.strengthEstimate);

  // strength match: if we have an estimate, require within 1 point (stricter)
  const gameStrength = toNumberOrNull(game.strength);
  const strengthEstimate = preferences.strengthEstimate;
  const strengthMatch =
    strengthEstimate == null || gameStrength == null
      ? true
      : Math.abs(gameStrength - strengthEstimate) <= 1.0;

  // region match: if distance available and userLocation provided, within 15km
  const regionMatch =
    hasLocation(userLocation) && typeof enriched.distanceKm === "number"
      ? enriched.distanceKm <= 15
      : true; // if we can't determine distance, don't block

  // require at least age and region to match; strength is helpful but optional
  return Boolean(ageMatch && regionMatch && strengthMatch);
}

const scoreGame = (game, preferences, userLocation) => {
  const strength = toNumberOrNull(game.strength);
  const strengthDelta =
    preferences.strengthEstimate != null && strength != null
      ? Math.abs(strength - preferences.strengthEstimate)
      : null;

  const strengthScore =
    strengthDelta == null ? 0.6 : Math.max(0, 1 - Math.min(strengthDelta / 4, 1));

  const distanceScore =
    hasLocation(userLocation) && typeof game.distanceKm === "number"
      ? 1 / (1 + game.distanceKm / 10)
      : 0.5;

  const timeScore = deriveTimeScore(game.date);

  const ageBonus =
    preferences.preferredAgeGroup &&
    game.normalizedAgeGroup === preferences.preferredAgeGroup
      ? 0.2
      : 0;

  const score = distanceScore * 0.5 + strengthScore * 0.3 + timeScore * 0.2 + ageBonus;

  return { ...game, recommendationScore: score };
};

/**
 * Filter games based on the viewer location and desired radius.
 * Returns games enriched with `distanceKm` when possible.
 */
export function filterGamesByDistance(games, userLocation, maxDistanceKm = BASE_RADIUS_KM) {
  const enriched = games.map((game) => enrichGame(game, userLocation));
  if (!hasLocation(userLocation)) {
    return enriched;
  }

  const withinRadius = enriched.filter(
    (game) => typeof game.distanceKm === "number" && game.distanceKm <= maxDistanceKm
  );

  if (withinRadius.length > 0) {
    const withoutCoords = enriched.filter((game) => game.distanceKm == null);
    return [...withinRadius, ...withoutCoords];
  }

  const withDistance = enriched
    .filter((game) => typeof game.distanceKm === "number")
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

  return withDistance.length > 0 ? withDistance : enriched;
}

/**
 * Build a ranked list of recommended games for the given user context.
 */
export function getRecommendedGames({
  games,
  userGames = [],
  userLocation = null,
  maxResults = 6,
}) {
  if (!Array.isArray(games) || games.length === 0) return [];

  const preferences = deriveUserPreferences(userGames);
  const enriched = games.map((game) => enrichGame(game, userLocation));

  let candidates = enriched;

  if (hasLocation(userLocation)) {
    let radius = BASE_RADIUS_KM;
    let filtered = candidates.filter(
      (game) => typeof game.distanceKm === "number" && game.distanceKm <= radius
    );

    while (filtered.length < 3 && radius < MAX_RADIUS_KM) {
      radius += 10;
      filtered = candidates.filter(
        (game) => typeof game.distanceKm === "number" && game.distanceKm <= radius
      );
    }

    if (filtered.length > 0) {
      const withoutCoords = candidates.filter((game) => game.distanceKm == null);
      candidates = [...filtered, ...withoutCoords];
    }
  }

  if (preferences.preferredAgeGroup) {
    const ageFiltered = candidates.filter((game) =>
      matchesAgeGroup(game.normalizedAgeGroup, preferences.preferredAgeGroup, preferences.strengthEstimate)
    );
    if (ageFiltered.length > 0) {
      candidates = ageFiltered;
    }
  }

  if (preferences.strengthEstimate != null) {
    const strengthFiltered = candidates.filter((game) => {
      const strength = toNumberOrNull(game.strength);
      if (strength == null) return true;
      return Math.abs(strength - preferences.strengthEstimate) <= 2;
    });

    if (strengthFiltered.length >= 3) {
      candidates = strengthFiltered;
    }
  }

  const scored = candidates
    .map((game) => scoreGame(game, preferences, userLocation))
    .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));

  const unique = [];
  const seen = new Set();
  for (const game of scored) {
    if (seen.has(game.id)) continue;
    unique.push(game);
    seen.add(game.id);
    if (unique.length >= maxResults) break;
  }

  return unique;
}

export default {
  getRecommendedGames,
  filterGamesByDistance,
};
