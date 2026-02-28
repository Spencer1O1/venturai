import { z } from "zod/v4";

/**
 * Strict Zod schema for AI assessment output.
 * Fail fast on invalid/missing required fields.
 * venturai_notes.md: actions.length <= 3, overall_priority/priority/severity in 0..1, risk_value 0..100.
 */
const recommendedPartSchema = z.object({
  name: z.string(),
  qty: z.number().int().min(0),
});

const actionSchema = z.object({
  suggested_key: z.string(),
  title: z.string(),
  priority: z.number().min(0).max(1),
  risk_value: z.number().int().min(0).max(100),
  reason: z.string().optional(),
  description: z.string().optional(),
  recommended_parts: z.array(recommendedPartSchema).optional(),
  estimated_cost: z.number().optional(),
});

const findingSchema = z.object({
  type: z.string(),
  severity: z.number().min(0).max(1),
  evidence: z.string(),
});

export const aiOutputSchema = z.object({
  summary: z.string(),
  overall_priority: z.number().min(0).max(1),
  findings: z.array(findingSchema),
  actions: z.array(actionSchema).max(3, "actions must have at most 3 items"),
});

export type AIOutput = z.infer<typeof aiOutputSchema>;

export function validateAIOutput(raw: unknown): AIOutput {
  const result = aiOutputSchema.safeParse(raw);
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
