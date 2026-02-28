import { z } from "zod/v4";

/**
 * Strict Zod schema for AI assessment output.
 * Fail fast on invalid/missing required fields.
 */
const recommendedPartSchema = z.object({
  name: z.string(),
  qty: z.number().int().min(0),
});

const workItemSchema = z.object({
  suggested_key: z
    .string()
    .regex(/^[a-z][a-z0-9_]{0,47}$/, "suggested_key must be snake_case, max 48 chars"),
  reused_from_key: z.string().nullable(),
  title: z.string(),
  priority: z.number().min(0).max(1),
  severity: z.number().min(0).max(1),
  risk_value: z.number().int().min(0).max(100),
  reason: z.string(),
  description: z.string(),
  estimated_effort: z.enum(["quick", "medium", "heavy"]),
  recommended_parts: z.array(recommendedPartSchema),
  estimated_cost: z.number().nullable(),
});

const findingSchema = z.object({
  type: z.string(),
  severity: z.number().min(0).max(1),
  evidence: z.string(),
});

export const aiAnalysisSchema = z.object({
  summary: z.string(),
  overall_priority: z.number().min(0).max(1),
  clarifying_questions: z.array(z.string()),
  findings: z.array(findingSchema),
  workItems: z
    .array(workItemSchema)
    .max(3, "workItems must have at most 3 items"),
});

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

export function validateAIAnalysis(raw: unknown): AIAnalysis {
  const result = aiAnalysisSchema.safeParse(raw);
  if (!result.success) {
    const issues =
      (
        result.error as {
          issues?: Array<{ path: (string | number)[]; message: string }>;
        }
      ).issues ?? [];
    const msg = issues
      .map((e) => `${(e.path ?? []).join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Invalid AI output: ${msg || result.error.message}`);
  }
  return result.data;
}
