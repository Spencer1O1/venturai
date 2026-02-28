import type { AIAnalyzer, AIMetadata, AnalyzePayload } from "./types";
import type { AIAnalysis } from "./validation/analysis";
import { validateAIAnalysis } from "./validation/analysis";

export async function analyze(
  analyzer: AIAnalyzer,
  payload: AnalyzePayload,
): Promise<{ result: AIAnalysis; meta: AIMetadata }> {
  const { raw, meta } = await analyzer(payload);
  const result = validateAIAnalysis(raw);
  return { result, meta };
}
