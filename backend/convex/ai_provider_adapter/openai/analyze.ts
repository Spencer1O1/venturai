"use node";

import type { AIAnalyzer, AnalyzePayload } from "../types";
import { AIAnalysisSchema } from "./schemas/analysis";

function buildSystemPrompt(): string {
  return `
  You are an industrial maintenance assessment AI.
  TASK:
  Analyze the attached images and metadata.
  Return exactly ONE JSON object conforming to the schema.

  UNCERTAINTY POLICY:
  - If evidence is insufficient, do NOT guess.
  - Use null where appropriate.
  - Set needs_clarification = true.
  - Add specific clarifying_questions.
  
  HARD RULES:
  - Output JSON ONLY (no markdown, no prose).
  - Do not invent specifics that are not visible or not provided. If unsure, use null and explain briefly in "evidence_summary".
  - MAX 3 actions in "actions" array. If nothing actionable, return [].
  - Reuse keys from "existing_open_action_keys" when the new action is substantially the same issue.
  - suggested_key MUST be snake_case matching ^[a-z][a-z0-9_]{0,47}$.
  - overall_priority, priority, severity are numbers in [0.0, 1.0].
  - risk_value is integer in [0, 100].

  SCORING RUBRIC (be consistent):
  - severity (0..1): consequence if it fails (safety, downtime, cost).
  - priority (0..1): urgency/timeline (how soon it should be addressed).
  - overall_priority (0..1): max(priority, severity) adjusted upward if evidence is strong and hazard is present.
  - risk_value (0..100): round(overall_priority * 100).

  KEY REUSE RULES:
  - Prefer an existing key (EXISTING_OPEN_ACTION_KEYS) if the core issue matches (same component + same failure mode), even if minor details differ.
  - If multiple existing keys fit, choose the closest match and mention which in "reused_from_key".
  - Only create a new key if none match.

  EVIDENCE RULES:
  - Every action must include "evidence" with what was observed in the image(s) and/or answers/notes.
  - If the intent is "problem", prioritize the most likely failure causing the reported issue.
  - If routine, prioritize safety hazards and critical wear first.
  `;
}

function buildUserMessage(payload: AnalyzePayload): string {
  const {
    assetMetadata,
    template,
    answers,
    notes,
    intent,
    existingOpenActionKeys,
  } = payload;

  const lines: string[] = [
    "ASSET_METADATA",
    `name: ${assetMetadata.assetName}`,
    `type: ${assetMetadata.assetType ?? "null"}`,
    `manufacturer: ${assetMetadata.manufacturer ?? "null"}`,
    `model: ${assetMetadata.model ?? "null"}`,
    `location: ${assetMetadata.locationText ?? "null"}`,
    `external_id: ${assetMetadata.externalId ?? "null"}`,
    `maintenance_group: ${assetMetadata.maintenanceGroupName ?? "null"}`,
    "",
    `INTENT: ${intent === "problem" ? "problem" : "routine"}`,
    "",
    "PHOTO_EXPECTATIONS (template, in order):",
    ...template.photoDescriptions.map((d, i) => `image_${i + 1}: ${d}`),
    "",
  ];

  if (template.additionalQuestions.length > 0) {
    lines.push("ANSWERS:");
    for (const q of template.additionalQuestions) {
      const v = answers[q.key];
      lines.push(`${q.key}: ${v ?? "null"}  // ${q.label}`);
    }
    lines.push("");
  }

  if (notes) {
    lines.push("NOTES:");
    lines.push(notes);
    lines.push("");
  }

  lines.push("EXISTING_OPEN_ACTION_KEYS:");
  lines.push(
    existingOpenActionKeys.length
      ? existingOpenActionKeys.join(", ")
      : "(none)",
  );
  lines.push("");

  return lines.join("\n");
}

export const analyze: AIAnalyzer = async (payload: AnalyzePayload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const schema = AIAnalysisSchema();

  const userContent: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string }
  > = [{ type: "input_text", text: buildUserMessage(payload) }];

  for (const url of payload.imageUrls) {
    userContent.push({ type: "input_image", image_url: url });
  }

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: buildSystemPrompt() }],
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "AIAssessmentOutput",
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI request failed: ${resp.status} ${err}`);
  }

  const data = (await resp.json()) as {
    output?: Array<{ content?: Array<{ type: string; text?: string }> }>;
  };
  const content = (data.output ?? []).flatMap((o) => o.content ?? []);
  const text = content.find((c) => c.type === "output_text")?.text;
  if (!text) {
    throw new Error("OpenAI response missing output_text");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`OpenAI returned invalid JSON: ${text.slice(0, 200)}`);
  }

  return {
    raw,
    meta: {
      provider: "openai",
      model,
      timestamp: Date.now(),
    },
  };
};
