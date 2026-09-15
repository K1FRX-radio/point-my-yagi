export {
  authenticationError,
  isSourceError,
  networkError,
  parsingError,
  permissionError,
  rateLimitError,
  sourceError,
  unavailableError,
} from "./errors";
export type { SourceError, SourceErrorCategory, SourceResult } from "./errors";
export { ManualTargetSource } from "./manual/manual-source";
export { TargetSourceRegistry } from "./registry";
export {
  asArray,
  asRecord,
  getNumber,
  getOptionalNumber,
  getOptionalNumberLike,
  getOptionalString,
  getString,
  parseRemote,
  SchemaError,
} from "./schema";
export {
  canCreate,
  canLookup,
  canSearch,
  type CreateCapableSource,
  type CreateRequest,
  type LookupCapableSource,
  type LookupRequest,
  type SearchCapableSource,
  type SearchRequest,
  type TargetSource,
  type TargetSourceInfo,
} from "./target-source";
