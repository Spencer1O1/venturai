import { v } from "convex/values";

/**
 * Convex validator for AI assessment output.
 * Mirrors validation/analysis.ts (Zod) for storage and return types.
 */
const recommendedPartValidator = v.object({
  name: v.string(),
  qty: v.number(),
});

const workItemValidator = v.object({
  suggested_key: v.string(),
  reused_from_key: v.union(v.string(), v.null()),
  title: v.string(),
  priority: v.number(),
  severity: v.number(),
  risk_value: v.number(),
  reason: v.string(),
  description: v.string(),
  estimated_effort: v.union(
    v.literal("quick"),
    v.literal("medium"),
    v.literal("heavy"),
  ),
  recommended_parts: v.array(recommendedPartValidator),
  estimated_cost: v.union(v.number(), v.null()),
});

const findingValidator = v.object({
  type: v.string(),
  severity: v.number(),
  evidence: v.string(),
});

export const aiAnalysisValidator = v.object({
  summary: v.string(),
  overall_priority: v.number(),
  clarifying_questions: v.array(v.string()),
  findings: v.array(findingValidator),
  workItems: v.array(workItemValidator),
});
