import type { ParseResult } from "./coordinates";
import { parseLatitude, parseLongitude } from "./coordinates";
import { isValidMaidenhead, maidenheadToCenter } from "./maidenhead";
import type { Target } from "./target";

/** Raw manual entry from the coordinate form. */
export interface ManualCoordinateInput {
  kind: "coordinates";
  latitude: string;
  longitude: string;
  name?: string;
}

/** Raw manual entry from the Maidenhead grid form. */
export interface ManualGridInput {
  kind: "grid";
  grid: string;
  name?: string;
}

export type ManualTargetInput = ManualCoordinateInput | ManualGridInput;

// Approximate radius (meters) of a Maidenhead cell by locator length, used as a
// coarse positional-uncertainty hint. Half the diagonal of the cell at mid-lat.
const GRID_UNCERTAINTY_METERS: Record<number, number> = {
  2: 1_200_000,
  4: 120_000,
  6: 5_000,
  8: 500,
};

function trimmedName(name: string | undefined): string | undefined {
  const trimmed = name?.trim();
  return trimmed ? trimmed : undefined;
}

function buildCoordinateTarget(input: ManualCoordinateInput): ParseResult<Target> {
  const latitude = parseLatitude(input.latitude);
  if (!latitude.ok) {
    return latitude;
  }
  const longitude = parseLongitude(input.longitude);
  if (!longitude.ok) {
    return longitude;
  }

  const name =
    trimmedName(input.name) ?? `${latitude.value.toFixed(5)}, ${longitude.value.toFixed(5)}`;

  return {
    ok: true,
    value: {
      id: `manual:coord:${latitude.value},${longitude.value}`,
      name,
      latitude: latitude.value,
      longitude: longitude.value,
      sourceType: "manual",
      sourceLabel: "Manual",
      precision: "high",
      locationWarning: "Coordinate entered manually. Accuracy depends on your source.",
    },
  };
}

function buildGridTarget(input: ManualGridInput): ParseResult<Target> {
  const grid = input.grid.trim().toUpperCase();
  if (!isValidMaidenhead(grid)) {
    return {
      ok: false,
      error: "Enter a valid 2, 4, 6, or 8 character Maidenhead locator (e.g. FN31pr).",
    };
  }

  const center = maidenheadToCenter(grid);
  const name = trimmedName(input.name) ?? grid;

  return {
    ok: true,
    value: {
      id: `manual:grid:${grid}`,
      name,
      latitude: center.latitude,
      longitude: center.longitude,
      sourceType: "manual",
      sourceLabel: "Manual grid",
      grid,
      precision: "approximate",
      uncertaintyRadiusMeters: GRID_UNCERTAINTY_METERS[grid.length],
      locationWarning: "Grid-center location. The true position lies somewhere within the square.",
    },
  };
}

/** Build a {@link Target} from manual coordinate or grid input, validating at the boundary. */
export function buildManualTarget(input: ManualTargetInput): ParseResult<Target> {
  return input.kind === "coordinates" ? buildCoordinateTarget(input) : buildGridTarget(input);
}
