/**
 * Build-time feature flags. Sources that require external approval stay off by
 * default until permission is documented in docs/data-source-policy.md.
 */
export interface FeatureFlags {
  /** RepeaterBook: off until RepeaterBook grants application approval. */
  repeaterBook: boolean;
}

export const featureFlags: FeatureFlags = {
  repeaterBook: false,
};
