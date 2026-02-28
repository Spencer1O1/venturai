import type { AIMetadata, AssetSuggester, SuggestAssetPayload } from "./types";
import {
  type AssetSuggestion,
  validateAssetSuggestion,
} from "./validation/asset_suggestion";

export async function suggestAsset(
  suggester: AssetSuggester,
  payload: SuggestAssetPayload,
): Promise<{ result: AssetSuggestion; meta: AIMetadata }> {
  const { raw, meta } = await suggester(payload);
  const result = validateAssetSuggestion(raw);
  return { result, meta };
}
