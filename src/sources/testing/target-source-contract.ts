import { describe, expect, it } from "vitest";

import { validateLatitude, validateLongitude, type Target } from "@/domain";

import { isSourceError } from "../errors";
import {
  canCreate,
  canLookup,
  canSearch,
  type CreateRequest,
  type LookupRequest,
  type SearchRequest,
  type TargetSource,
} from "../target-source";

function expectValidTarget(target: Target, source: TargetSource) {
  expect(target.id).toBeTruthy();
  expect(target.name).toBeTruthy();
  expect(validateLatitude(target.latitude)).toBe(true);
  expect(validateLongitude(target.longitude)).toBe(true);
  expect(target.sourceType).toBe(source.info.sourceType);
  expect(target.precision).toBeTruthy();
}

export interface TargetSourceContractOptions {
  source: TargetSource;
  sampleCreate?: CreateRequest;
  sampleSearch?: SearchRequest;
  sampleLookup?: LookupRequest;
}

/**
 * Shared contract every {@link TargetSource} adapter must satisfy: valid info,
 * at least one capability, and well-formed results for the provided samples.
 */
export function describeTargetSourceContract(label: string, options: TargetSourceContractOptions) {
  const { source, sampleCreate, sampleSearch, sampleLookup } = options;

  describe(`TargetSource contract: ${label}`, () => {
    it("exposes valid info", () => {
      expect(source.info.id).toBeTruthy();
      expect(source.info.label).toBeTruthy();
      expect(source.info.sourceType).toBeTruthy();
    });

    it("declares at least one capability", () => {
      expect(canCreate(source) || canSearch(source) || canLookup(source)).toBe(true);
    });

    if (sampleCreate) {
      it("create returns a well-formed target", () => {
        if (!canCreate(source)) throw new Error("sampleCreate provided but source cannot create");
        const result = source.create(sampleCreate);
        expect(result.ok).toBe(true);
        if (result.ok) expectValidTarget(result.value, source);
      });
    }

    if (sampleSearch) {
      it("search returns well-formed targets", async () => {
        if (!canSearch(source)) throw new Error("sampleSearch provided but source cannot search");
        const result = await source.search(sampleSearch);
        expect(result.ok).toBe(true);
        if (result.ok) result.value.forEach((t) => expectValidTarget(t, source));
      });
    }

    if (sampleLookup) {
      it("lookup returns a well-formed target", async () => {
        if (!canLookup(source)) throw new Error("sampleLookup provided but source cannot lookup");
        const result = await source.lookup(sampleLookup);
        expect(result.ok).toBe(true);
        if (result.ok) expectValidTarget(result.value, source);
        else expect(isSourceError(result.error)).toBe(true);
      });
    }
  });
}
