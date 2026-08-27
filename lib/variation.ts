export type VariantHistory = Record<string, number>;

type VariantSelection<T> = {
  value: T;
  history: VariantHistory;
};

/**
 * Select one variant without repeating the last selection for the same key.
 * The supplied history is deliberately plain JSON so server-side callers can
 * persist it in an existing private cache entry and client callers can retain
 * it in a ref without exposing any repository data.
 */
export function selectNonRepeatingVariant<T>(
  key: string,
  variants: readonly T[],
  history: VariantHistory = {},
): VariantSelection<T> {
  if (!variants.length) {
    throw new Error("At least one copy variant is required");
  }

  const lastIndex = history[key];
  const eligibleIndexes = variants
    .map((_, index) => index)
    .filter((index) => variants.length === 1 || index !== lastIndex);
  const nextIndex = eligibleIndexes[Math.floor(Math.random() * eligibleIndexes.length)] ?? 0;

  return {
    value: variants[nextIndex] as T,
    history: { ...history, [key]: nextIndex },
  };
}
