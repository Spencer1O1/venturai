import type { AIOutput } from "./ai_output_schema";
import { parseRawAIResponse } from "./parse_raw_ai_response";
import type { AIAnalyzer, AIMetadata, AnalyzePayload } from "./types";

export async function analyze(
  analyzer: AIAnalyzer,
  payload: AnalyzePayload,
): Promise<{ result: AIOutput; meta: AIMetadata }> {
  const { raw, meta } = await analyzer(payload);
  const result = parseRawAIResponse(raw);
  return { result, meta };
}
