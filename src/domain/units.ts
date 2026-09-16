/** Distance unit preference. */
export type DistanceUnit = "metric" | "imperial";

const METERS_PER_MILE = 1609.344;
const METERS_PER_FOOT = 0.3048;

/** Format a distance in meters for display in the chosen unit system. */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return "—";
  }
  if (unit === "imperial") {
    const miles = meters / METERS_PER_MILE;
    if (miles < 0.1) {
      return `${Math.round(meters / METERS_PER_FOOT)} ft`;
    }
    return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
  }
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)} m`;
  }
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
