// AI analysis result (assessment output with workItems, findings, etc.)
export type { AIAnalysis } from "./ai_provider_adapter/validation/analysis";

export type PreviousAiContext = {
  confidence: number;
  clarifying_question: string | null;
};

export type LocationContext = {
  lat?: number;
  lon?: number;
  accuracyM?: number;
};
