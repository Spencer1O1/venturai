import { z } from "zod/v4";

export const assetSuggestionSchema = z.object({
  name: z.string().min(1),
  maintenance_group_id: z.string().min(1),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
});

export type AssetSuggestion = z.infer<typeof assetSuggestionSchema>;

/**
 * JSON Schema for OpenAI Responses API (strict mode).
 * Kept here next to the Zod schema so they stay in sync.
 */
export function getAssetSuggestionJsonSchema(groupIds: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1 },
      maintenance_group_id: { type: "string", enum: groupIds },
      manufacturer: { type: "string" },
      model: { type: "string" },
      serial: { type: "string" },
    },
    required: ["name", "maintenance_group_id"],
  } as const;
}

export function validateAssetSuggestion(raw: unknown): AssetSuggestion {
  const result = assetSuggestionSchema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid asset suggestion: ${msg}`);
  }
  return result.data;
}
