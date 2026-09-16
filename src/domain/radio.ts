/** Amateur radio frequency helpers. All bands are HF/VHF/UHF ranges in MHz. */

interface Band {
  label: string;
  minMhz: number;
  maxMhz: number;
}

// Common amateur allocations, coarse edges. Order does not matter (non-overlapping).
const BANDS: Band[] = [
  { label: "2200m", minMhz: 0.1357, maxMhz: 0.1378 },
  { label: "630m", minMhz: 0.472, maxMhz: 0.479 },
  { label: "160m", minMhz: 1.8, maxMhz: 2.0 },
  { label: "80m", minMhz: 3.5, maxMhz: 4.0 },
  { label: "60m", minMhz: 5.2, maxMhz: 5.45 },
  { label: "40m", minMhz: 7.0, maxMhz: 7.3 },
  { label: "30m", minMhz: 10.1, maxMhz: 10.15 },
  { label: "20m", minMhz: 14.0, maxMhz: 14.35 },
  { label: "17m", minMhz: 18.068, maxMhz: 18.168 },
  { label: "15m", minMhz: 21.0, maxMhz: 21.45 },
  { label: "12m", minMhz: 24.89, maxMhz: 24.99 },
  { label: "10m", minMhz: 28.0, maxMhz: 29.7 },
  { label: "6m", minMhz: 50.0, maxMhz: 54.0 },
  { label: "2m", minMhz: 144.0, maxMhz: 148.0 },
  { label: "1.25m", minMhz: 222.0, maxMhz: 225.0 },
  { label: "70cm", minMhz: 420.0, maxMhz: 450.0 },
];

// Plausible amateur frequency range in MHz, used to pick the right input unit.
const MIN_PLAUSIBLE_MHZ = 0.1;
const MAX_PLAUSIBLE_MHZ = 30_000;

function inRange(mhz: number): boolean {
  return mhz >= MIN_PLAUSIBLE_MHZ && mhz <= MAX_PLAUSIBLE_MHZ;
}

/**
 * Convert a POTA-style frequency (usually kHz, occasionally submitted in Hz) to
 * MHz. Tries kHz first, then falls back to Hz when the kHz reading is implausible
 * (e.g. a UHF spot logged as "436795000"). Returns `undefined` for missing,
 * non-numeric, or out-of-range values.
 */
export function frequencyKhzToMhz(value: string | number | undefined | null): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num) || num <= 0) {
    return undefined;
  }
  const asKhz = num / 1_000;
  if (inRange(asKhz)) {
    return asKhz;
  }
  const asHz = num / 1_000_000;
  return inRange(asHz) ? asHz : undefined;
}

/** Amateur band label for a frequency in MHz, or `undefined` if outside known bands. */
export function bandForMhz(mhz: number | undefined | null): string | undefined {
  if (mhz == null || !Number.isFinite(mhz)) {
    return undefined;
  }
  return BANDS.find((b) => mhz >= b.minMhz && mhz <= b.maxMhz)?.label;
}
