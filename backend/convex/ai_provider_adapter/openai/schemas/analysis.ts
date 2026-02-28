/**
 * JSON Schema for OpenAI Responses API (strict mode).
 * Kept here next to the Zod schema so they stay in sync.
 */
export function AIAnalysisSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      overall_priority: { type: "number", minimum: 0, maximum: 1 },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string" },
            severity: { type: "number", minimum: 0, maximum: 1 },
            evidence: { type: "string" },
          },
          required: ["type", "severity", "evidence"],
        },
      },
      actions: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            suggested_key: { type: "string" },
            title: { type: "string" },
            priority: { type: "number", minimum: 0, maximum: 1 },
            risk_value: {
              type: "integer",
              minimum: 0,
              maximum: 100,
            },
            reason: { type: "string" },
            description: { type: "string" },
            recommended_parts: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  qty: { type: "integer", minimum: 0 },
                },
                required: ["name", "qty"],
              },
            },
            estimated_cost: { type: "number" },
          },
          required: ["suggested_key", "title", "priority", "risk_value"],
        },
      },
    },
    required: ["summary", "overall_priority", "findings", "actions"],
  } as const;
}
