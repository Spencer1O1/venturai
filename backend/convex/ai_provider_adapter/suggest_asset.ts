import type { AssetSuggester, SuggestAssetPayload } from "./types";
import { validateAssetSuggestion } from "./validation/asset_suggestion";

export async function suggestAsset(
  suggester: AssetSuggester,
  payload: SuggestAssetPayload,
) {
  const { raw, meta } = await suggester(payload);
  const result = validateAssetSuggestion(raw);
  return { result, meta };
}
