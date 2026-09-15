import { normalizeDegrees } from "./angles";
import type { LatLon } from "./coordinates";

/**
 * IUGG mean Earth radius R1 = (2a + b) / 3, in meters. Used as the sphere radius
 * for great-circle bearing and haversine distance. Distances are accurate to a
 * few tenths of a percent versus an ellipsoidal model, which is well within the
 * uncertainty of the target coordinates this app works with.
 */
export const EARTH_MEAN_RADIUS_METERS = 6_371_008.8;

const DEG_TO_RAD = Math.PI / 180;

/**
 * Great-circle initial bearing (degrees, [0, 360)) from `from` to `to` on a
 * sphere. Returns 0 for identical points (bearing is otherwise undefined).
 */
export function initialBearingDeg(from: LatLon, to: LatLon): number {
  const phi1 = from.latitude * DEG_TO_RAD;
  const phi2 = to.latitude * DEG_TO_RAD;
  const deltaLambda = (to.longitude - from.longitude) * DEG_TO_RAD;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return normalizeDegrees(Math.atan2(y, x) / DEG_TO_RAD);
}

/**
 * Great-circle distance (meters) between two coordinates using the haversine
 * formula and {@link EARTH_MEAN_RADIUS_METERS}.
 */
export function greatCircleDistanceMeters(from: LatLon, to: LatLon): number {
  const phi1 = from.latitude * DEG_TO_RAD;
  const phi2 = to.latitude * DEG_TO_RAD;
  const deltaPhi = (to.latitude - from.latitude) * DEG_TO_RAD;
  const deltaLambda = (to.longitude - from.longitude) * DEG_TO_RAD;

  const a =
    Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_MEAN_RADIUS_METERS * c;
}
