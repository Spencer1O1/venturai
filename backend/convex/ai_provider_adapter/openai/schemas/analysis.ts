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
      clarifying_questions: {
        type: "array",
        items: { type: "string" },
      },
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
      workItems: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            suggested_key: {
              type: "string",
              pattern: "^[a-z][a-z0-9_]{0,47}$",
              maxLength: 48,
            },
            reused_from_key: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            title: { type: "string" },
            priority: { type: "number", minimum: 0, maximum: 1 },
            severity: { type: "number", minimum: 0, maximum: 1 },
            risk_value: {
              type: "integer",
              minimum: 0,
              maximum: 100,
            },
            reason: { type: "string" },
            description: { type: "string" },
            estimated_effort: {
              type: "string",
              enum: ["quick", "medium", "heavy"],
            },
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
          required: [
            "suggested_key",
            "reused_from_key",
            "title",
            "priority",
            "severity",
            "risk_value",
            "reason",
            "description",
            "estimated_effort",
          ],
        },
      },
    },
    required: [
      "summary",
      "overall_priority",
      "clarifying_questions",
      "findings",
      "workItems",
    ],
  } as const;
}
