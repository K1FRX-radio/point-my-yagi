import {
  canCreate,
  canLookup,
  canSearch,
  type CreateCapableSource,
  type LookupCapableSource,
  type SearchCapableSource,
  type TargetSource,
} from "./target-source";

/**
 * A small in-memory registry so features can discover sources and inject mocks
 * in tests. Ids must be unique.
 */
export class TargetSourceRegistry {
  private readonly sources = new Map<string, TargetSource>();

  register(source: TargetSource): this {
    if (this.sources.has(source.info.id)) {
      throw new Error(`A target source with id "${source.info.id}" is already registered.`);
    }
    this.sources.set(source.info.id, source);
    return this;
  }

  get(id: string): TargetSource | undefined {
    return this.sources.get(id);
  }

  list(): TargetSource[] {
    return [...this.sources.values()];
  }

  creatable(): CreateCapableSource[] {
    return this.list().filter(canCreate);
  }

  searchable(): SearchCapableSource[] {
    return this.list().filter(canSearch);
  }

  lookupable(): LookupCapableSource[] {
    return this.list().filter(canLookup);
  }
}
