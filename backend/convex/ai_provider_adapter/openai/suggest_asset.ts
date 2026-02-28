"use node";

import type { AssetSuggester, SuggestAssetPayload } from "../types";
import { AssetSuggestionSchema } from "./schemas/asset_suggestion";

function buildSystemPrompt(groupsList: string): string {
  return [
    "You are an industrial asset registration assistant.",
    "TASK: Analyze the attached photo of an asset and suggest registration details. Return exactly ONE JSON object conforming to the schema.",
    "",
    "HARD RULES:",
    "- Do not invent specifics that are not visible in the photo.",
    "- name: Human-readable asset name.",
    "- maintenance_group_id: MUST be exactly one of the IDs from the MAINTENANCE_GROUPS list below. Use the ID string, not the name.",
    "- manufacturer, model, serial: Include ONLY if visible/readable in the photo. Omit the field entirely if not visible.",
    "",
    "MAINTENANCE_GROUPS (maintenance_group_id must equal one of the IDs):",
    groupsList,
  ].join("\n");
}

function buildUserMessage(): string {
  return "Analyze this asset photo and return the structured suggestion.";
}

export const suggestAsset: AssetSuggester = async (
  payload: SuggestAssetPayload,
) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_MODEL;
  if (!model) {
    throw new Error("OPENAI_MODEL is not set");
  }

  const groupIds = payload.maintenanceGroups.map((g) => g._id);
  const groupsList = payload.maintenanceGroups
    .map((g) => `- ${g.name} (${g._id})`)
    .join("\n");
  const schema = AssetSuggestionSchema(groupIds);

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
          content: [
            { type: "input_text", text: buildSystemPrompt(groupsList) },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildUserMessage(),
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
