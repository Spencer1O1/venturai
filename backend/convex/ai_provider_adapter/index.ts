import { analyze as analyzeOpenAi } from "./openai";
import { suggestAsset as suggestAssetOpenAI } from "./openai/suggest_asset";

export { analyze } from "./analyze";
export { suggestAsset } from "./suggest_asset";

export const ANALYZERS = {
  OpenAI: analyzeOpenAi,
  // Gemini: analyzeGemini,
  // Claude: analyzeClaude,
};

export const ASSET_SUGGESTERS = {
  OpenAI: suggestAssetOpenAI,
  // Gemini: suggestAssetGemini,
  // Claude: suggestAssetClaude,
};

export * from "./types";
