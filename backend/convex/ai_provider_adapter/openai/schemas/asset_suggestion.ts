/**
 * JSON Schema for OpenAI Responses API (strict mode).
 * Kept here next to the Zod schema so they stay in sync.
 */
export function AssetSuggestionSchema(groupIds: string[]) {
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
