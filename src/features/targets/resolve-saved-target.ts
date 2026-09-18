import { isSavedRef, type SavedTarget, type Target } from "@/domain";
import { getRepeaterBookToken } from "@/features/repeaterbook/credential-store";
import {
  parsingError,
  RepeaterBookTargetSource,
  unavailableError,
  type SourceResult,
} from "@/sources";

/**
 * Turn a saved list entry back into a full pointing target. Full entries return
 * as-is; RepeaterBook references (which store no coordinates at rest) are
 * re-fetched live from RepeaterBook by callsign using the user's own token.
 */
export async function resolveSavedTarget(saved: SavedTarget): Promise<SourceResult<Target>> {
  if (!isSavedRef(saved)) {
    return { ok: true, value: saved };
  }
  if (saved.sourceType !== "repeaterbook") {
    return { ok: false, error: unavailableError("This saved target can no longer be resolved.") };
  }
  if (!saved.callsign) {
    return {
      ok: false,
      error: parsingError("This saved RepeaterBook target is missing its callsign."),
    };
  }

  const token = await getRepeaterBookToken();
  const source = new RepeaterBookTargetSource({ token: token ?? undefined });
  const result = await source.search({ text: saved.callsign });
  if (!result.ok) {
    return result;
  }

  const match =
    result.value.find((t) => t.id === saved.id) ??
    result.value.find((t) => t.sourceRecordId === saved.sourceRecordId);
  if (!match) {
    return {
      ok: false,
      error: unavailableError("This repeater could not be found on RepeaterBook."),
    };
  }
  return { ok: true, value: match };
}
