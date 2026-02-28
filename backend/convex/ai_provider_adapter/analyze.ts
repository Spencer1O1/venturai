import type { AIOutput } from "./ai_output_schema";
import type { AIAnalyzer, AIMetadata, AnalyzePayload } from "./types";
import { validateAIAnalysis } from "./validation/analyze";

export async function analyze(
  analyzer: AIAnalyzer,
  payload: AnalyzePayload,
): Promise<{ result: AIOutput; meta: AIMetadata }> {
  const { raw, meta } = await analyzer(payload);
  const result = validateAIAnalysis(raw);
  return { result, meta };
}
