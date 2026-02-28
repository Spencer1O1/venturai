import { v } from "convex/values";

/**
 * Convex validator for AI assessment output.
 * Mirrors ai_output_schema.ts (Zod) for storage and return types.
 */
const recommendedPartValidator = v.object({
  name: v.string(),
  qty: v.number(),
});

const actionValidator = v.object({
  suggested_key: v.string(),
  title: v.string(),
  priority: v.number(),
  risk_value: v.number(),
  reason: v.optional(v.string()),
  description: v.optional(v.string()),
  recommended_parts: v.optional(v.array(recommendedPartValidator)),
  estimated_cost: v.optional(v.number()),
});

const findingValidator = v.object({
  type: v.string(),
  severity: v.number(),
  evidence: v.string(),
});

export const aiOutputValidator = v.object({
  summary: v.string(),
  overall_priority: v.number(),
  findings: v.array(findingValidator),
  actions: v.array(actionValidator),
});
