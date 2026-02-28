import { analyze as analyzeOpenAi } from "./openai";

export { analyze } from "./analyze";

export const ANALYZERS = {
  OpenAI: analyzeOpenAi,
  // Gemini: analyzeGemini,
  // Claude: analyzeClaude,
};
