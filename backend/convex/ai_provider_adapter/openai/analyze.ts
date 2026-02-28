"use node";

import type { AIAnalyzer, AnalyzePayload } from "../types";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

function buildSystemPrompt(): string {
  return `You are an industrial maintenance assessment AI. Analyze asset photos and metadata to produce a structured JSON report.

RULES:
- Return JSON ONLY. No markdown, no code fences, no extra text.
- Maximum 3 actions. Prioritize by risk and urgency.
- suggested_key MUST be snake_case matching ^[a-z][a-z0-9_]{0,47}$
- Prefer reusing existing action keys when the finding matches.
- overall_priority, priority, severity: 0.0 to 1.0
- risk_value: integer 0 to 100
- Be concise.`;
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
    "## Asset",
    `Name: ${assetMetadata.assetName}`,
    ...(assetMetadata.assetType ? [`Type: ${assetMetadata.assetType}`] : []),
    ...(assetMetadata.manufacturer
      ? [`Manufacturer: ${assetMetadata.manufacturer}`]
      : []),
    ...(assetMetadata.model ? [`Model: ${assetMetadata.model}`] : []),
    ...(assetMetadata.locationText
      ? [`Location: ${assetMetadata.locationText}`]
      : []),
    ...(assetMetadata.externalId
      ? [`External ID: ${assetMetadata.externalId}`]
      : []),
    ...(assetMetadata.maintenanceGroupName
      ? [`Maintenance Group: ${assetMetadata.maintenanceGroupName}`]
      : []),
    "",
    "## Intent",
    intent === "problem" ? "Report a problem" : "Routine assessment",
    "",
    "## Required photo descriptions (template)",
    ...template.photoDescriptions.map((d, i) => `- ${i + 1}. ${d}`),
    "",
  ];

  if (template.additionalQuestions.length > 0) {
    lines.push("## Answers");
    for (const q of template.additionalQuestions) {
      const v = answers[q.key];
      lines.push(`- ${q.label}: ${v ?? "(not provided)"}`);
    }
    lines.push("");
  }

  if (notes) {
    lines.push("## Notes", notes, "");
  }

  if (existingOpenActionKeys.length > 0) {
    lines.push(
      "## Existing open action keys (reuse when applicable)",
      existingOpenActionKeys.join(", "),
      "",
    );
  }

  lines.push("Analyze the attached images and return the JSON report.");
  return lines.join("\n");
}

export const analyze: AIAnalyzer = async (payload: AnalyzePayload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: buildUserMessage(payload) }];

  for (const url of payload.imageUrls) {
    content.push({ type: "image_url", image_url: { url } });
  }

  const resp = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI request failed: ${resp.status} ${err}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenAI response missing content");
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
