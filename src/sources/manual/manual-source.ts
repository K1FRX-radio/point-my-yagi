import { buildManualTarget, type Target } from "@/domain";

import { parsingError, type SourceResult } from "../errors";
import type { CreateRequest, TargetSource, TargetSourceInfo } from "../target-source";

/** Builds targets from manually entered coordinates or Maidenhead grid input. */
export class ManualTargetSource implements TargetSource {
  readonly info: TargetSourceInfo = {
    id: "manual",
    label: "Manual",
    sourceType: "manual",
  };

  create(request: CreateRequest): SourceResult<Target> {
    const result = buildManualTarget(request.input);
    if (!result.ok) {
      return { ok: false, error: parsingError(result.error) };
    }
    return { ok: true, value: result.value };
  }
}
