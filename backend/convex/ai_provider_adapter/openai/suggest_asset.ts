"use node";

import { getAssetSuggestionJsonSchema } from "../asset_suggestion_schema";
import type { AssetSuggester, SuggestAssetPayload } from "../types";

export const suggestAsset: AssetSuggester = async (
  payload: SuggestAssetPayload,
) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  const groupIds = payload.maintenanceGroups.map((g) => g._id);
  const groupsList = payload.maintenanceGroups
    .map((g) => `- ${g.name} [${g._id}]`)
    .join("\n");
  const schema = getAssetSuggestionJsonSchema(groupIds);

  const systemPrompt = [
    "You are an industrial asset registration assistant. Analyze the photo of an asset and suggest registration details.",
    "",
    "Rules:",
    "- name: Human-readable asset name (e.g. Diaphragm Pump #1)",
    "- maintenance_group_id: MUST be exactly one of the IDs from the maintenance groups list",
    "- manufacturer, model, serial: Include only if visible/readable in the photo; omit otherwise",
    "",
    "Maintenance groups:",
    groupsList,
  ].join("\n");

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
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this asset photo and return the structured suggestion.",
            },
            {
              type: "input_image",
              image_url: payload.imageUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "AssetSuggestion",
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
  if (!text) throw new Error("OpenAI response missing output_text");

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
