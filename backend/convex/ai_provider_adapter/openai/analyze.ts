"use node";

import type { AIAnalyzer, AnalyzePayload } from "../types";
import { AIAnalysisSchema } from "./schemas/analysis";

function buildSystemPrompt(): string {
  return [
    "You are an industrial maintenance assessment AI.",
    "TASK: Analyze the attached images of assets and metadata. Return exactly ONE JSON object conforming to the schema.",
    "",
    "UNCERTAINTY POLICY:",
    "- If evidence is insufficient, do NOT guess. Add specific clarifying_questions (strings).",
    "- If confident, return clarifying_questions: [].",
    "",
    "HARD RULES:",
    "- Do not invent specifics that are not visible or not provided.",
    "- MAX 3 work items in the workItems array. If nothing actionable, return [].",
    "- workItems can be empty array; findings can be empty array too. Do not invent findings when workItems is empty.",
    "- Reuse keys from EXISTING_OPEN_ACTION_KEYS when the work item is substantially the same issue. Set reused_from_key to that key, or null if new.",
    "- suggested_key must match ^[a-z][a-z0-9_]{0,47}$ (max 48 chars).",
    "- overall_priority, priority, severity: numbers in [0.0, 1.0].",
    "- risk_value: integer in [0, 100].",
    "- estimated_effort: one of quick, medium, heavy.",
    "- recommended_parts: [] when none; estimated_cost: null when unknown.",
    "",
    "SCORING RUBRIC:",
    "- severity (0..1): impact if unaddressed (safety, downtime, cost). Use in findings and workItems.",
    "- priority (0..1): urgency/time-to-act. Use in workItems.",
    "- workItems[].risk_value (0..100): integer round(max(priority, severity) * 100).",
    "- overall_priority (0..1): max of max(priority, severity) across workItems; if workItems is empty, derive from findings severity (or use 0).",
    "",
    "KEY REUSE: Prefer existing keys if the core issue matches. Only create new key if none match.",
    "EVIDENCE: Every work item needs reason/description. If intent is problem, prioritize most likely failure. If routine, prioritize safety and critical wear first.",
  ].join("\n");
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
  if (existingOpenActionKeys.length) {
    for (const key of existingOpenActionKeys) {
      lines.push(`- ${key}`);
    }
  } else {
    lines.push("(none)");
  }
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
