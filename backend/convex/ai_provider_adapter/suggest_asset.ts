import { validateAssetSuggestion } from "./asset_suggestion_schema";
import type { AssetSuggester, SuggestAssetPayload } from "./types";

export async function suggestAsset(
  suggester: AssetSuggester,
  payload: SuggestAssetPayload,
) {
  const { raw, meta } = await suggester(payload);
  const result = validateAssetSuggestion(raw);
  return { result, meta };
}
