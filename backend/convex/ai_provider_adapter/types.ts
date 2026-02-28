export type AIMetadata = {
  provider: "openai" | "gemini" | "claude";
  model?: string;
  requestId?: string;
  timestamp: number;
  latencyMs?: number;
};

export type AIAnalyzerResponse = {
  raw: unknown;
  meta: AIMetadata;
};

export type AnalyzePayload = {
  imageUrl: string;
};

export type AIAnalyzer = (
  payload: AnalyzePayload,
) => Promise<AIAnalyzerResponse>;
