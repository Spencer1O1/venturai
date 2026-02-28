import type { AIOutput } from "./ai_output_schema";

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
  imageUrls: string[];
  assetMetadata: {
    assetName: string;
    assetType?: string;
    manufacturer?: string;
    model?: string;
    locationText?: string;
    externalId?: string;
    maintenanceGroupName?: string;
  };
  template: {
    photoDescriptions: string[];
    additionalQuestions: Array<{ key: string; label: string; type: string }>;
  };
  answers: Record<string, string | number | boolean>;
  notes?: string;
  intent: "routine" | "problem";
  existingOpenActionKeys: string[];
};

export type AIAnalyzer = (
  payload: AnalyzePayload,
) => Promise<AIAnalyzerResponse>;

export type SuggestAssetPayload = {
  imageUrl: string;
  maintenanceGroups: Array<{ _id: string; name: string }>;
};

export type AssetSuggesterResponse = {
  raw: unknown;
  meta: AIMetadata;
};

export type AssetSuggester = (
  payload: SuggestAssetPayload,
) => Promise<AssetSuggesterResponse>;

export type { AIOutput };
