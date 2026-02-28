import type { AIResult } from "../types";
import { parseRawAIResponse } from "./parse_raw_ai_response";
import type { AIAnalyzer, AIMetadata, AnalyzePayload } from "./types";

export async function analyze(
  analyzer: AIAnalyzer,
  payload: AnalyzePayload,
): Promise<{ result: AIResult; meta: AIMetadata }> {
  const { raw, meta } = await analyzer(payload);
  const result = parseRawAIResponse(raw);
  return { result, meta };
}
