// src/utils/distance.js
// Haversine distance helpers shared across list and recommendation logic.

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians.
 * @param {number} value
 * @returns {number}
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calculate the great-circle distance in kilometres between two coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number | null}
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return null;
  }

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const distance = 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number.isFinite(distance) ? distance : null;
}

export default calculateDistanceKm;
