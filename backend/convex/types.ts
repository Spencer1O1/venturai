export type AIResult = {};

export type PreviousAiContext = {
  confidence: number;
  clarifying_question: string | null;
};

export type LocationContext = {
  lat?: number;
  lon?: number;
  accuracyM?: number;
};
