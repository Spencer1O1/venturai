import { z } from "zod/v4";

export const assetSuggestionSchema = z.object({
  name: z.string().min(1),
  maintenance_group_id: z.string().min(1),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  serial: z.string().nullable(),
});

export type AssetSuggestion = z.infer<typeof assetSuggestionSchema>;

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
