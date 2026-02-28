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
      manufacturer: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      model: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      serial: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
    },
    required: ["name", "maintenance_group_id", "manufacturer", "model", "serial"],
  } as const;
}
