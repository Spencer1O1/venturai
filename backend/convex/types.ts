// AI result type re-exported from ai_provider_adapter
export type { AIOutput as AIResult } from "./ai_provider_adapter/ai_output_schema";

export type PreviousAiContext = {
  confidence: number;
  clarifying_question: string | null;
};

export type LocationContext = {
  lat?: number;
  lon?: number;
  accuracyM?: number;
};
