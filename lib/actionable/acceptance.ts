export function formatAcceptanceCriteria(criteria: readonly string[]): string[] {
  return criteria.map((c) => c.trim()).filter((c) => c.length > 0);
}

export function validateCriteria(criteria: unknown): criteria is string[] {
  return Array.isArray(criteria) && criteria.every((c) => typeof c === "string" && c.trim().length > 0);
}
