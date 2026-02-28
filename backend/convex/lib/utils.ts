/**
 * Venturai backend utilities.
 * - computeRiskScoreFromLoad: saturating curve for 0-100 display score
 * - normalizeActionKey: validate/derive snake_case key from AI output
 * - shouldCreateWorkItem: backend policy for work item creation (ignore AI work_required)
 */

const ACTION_KEY_REGEX = /^[a-z][a-z0-9_]{0,47}$/;

/**
 * riskScore = round(100 * (1 - exp(-riskLoad / 60)))
 * Bounded 0-100 from unbounded riskLoad.
 */
export function computeRiskScoreFromLoad(riskLoad: number): number {
  return Math.round(100 * (1 - Math.exp(-riskLoad / 60)));
}

/**
 * Validates actionKey against ^[a-z][a-z0-9_]{0,47}$.
 * If invalid, derives a safe key from title (slugify).
 */
export function normalizeActionKey(titleOrKey: string): string {
  const trimmed = titleOrKey.trim();
  if (!trimmed) return "unknown";

  if (ACTION_KEY_REGEX.test(trimmed)) return trimmed;

  // Derive from title: lowercase, replace non-alnum with _, collapse _
  let slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!slug) return "unknown";
  // Ensure starts with letter
  if (/^[0-9]/.test(slug)) slug = `a_${slug}`;
  // Truncate to 48 chars
  if (slug.length > 48) slug = slug.slice(0, 48).replace(/_+$/, "") || "unknown";
  return slug || "unknown";
}

/**
 * Create/update workItem only if riskValue >= 15 OR priorityScore >= 0.8.
 * Backend is authoritative; do not rely on AI work_required.
 */
export function shouldCreateWorkItem(
  riskValue: number,
  priorityScore: number,
): boolean {
  return riskValue >= 15 || priorityScore >= 0.8;
}
