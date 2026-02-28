import type { AIAnalyzer, AnalyzePayload } from "../types";

export const analyze: AIAnalyzer = async (payload: AnalyzePayload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = process.env.OPENAI_API_KEY;

  const schema = {
    types: "object",
    additionalProperties: false,
    properties: {},
    required: [],
  } as const;

  // System prompt
  const system = [""].join("\n");

  const uSections: string[] = [];

  const userText = uSections.join("\n");

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        {
          role: "user",
          content: [
            { type: "input_text", text: userText },
            { type: "input_image", image_url: payload.imageUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "AssetAnalysis",
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

  const data = await resp.json();

  // Extract the JSON text from Responses output
  const content = (data.output ?? []).flatMap((o: any) => o.content ?? []);
  const text = content.find((c: any) => c.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI response missing output_text");

  return {
    raw: JSON.parse(text),
    meta: {
      provider: "openai",
      timestamp: Date.now(),
    },
  };
};
