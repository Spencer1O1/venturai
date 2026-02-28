"use node";

import type { AssetSuggester, SuggestAssetPayload } from "../types";

export const suggestAsset: AssetSuggester = async (
  payload: SuggestAssetPayload,
) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const groupsList = payload.maintenanceGroups
    .map((g) => `- ${g._id}: ${g.name}`)
    .join("\n");

  const systemPrompt = `You are an industrial asset registration assistant. Analyze the photo of an asset and suggest registration details.

Return JSON ONLY. No markdown, no code fences.
Schema:
{
  "name": "Human-readable asset name (e.g. Diaphragm Pump #1)",
  "maintenance_group_id": "Exactly one of the IDs from the maintenance groups list below",
  "manufacturer": "Manufacturer name if visible, else omit",
  "model": "Model number if visible, else omit",
  "serial": "Serial number if visible, else omit"
}

Maintenance groups (use exactly one _id for maintenance_group_id):
${groupsList}`;

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    { type: "text", text: "Analyze this asset photo and return the JSON." },
    { type: "image_url", image_url: { url: payload.imageUrl } },
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      max_tokens: 512,
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
  if (!text) throw new Error("OpenAI response missing content");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
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
