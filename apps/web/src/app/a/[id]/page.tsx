import { redirect } from "next/navigation";

/**
 * NFC deep link fallback: /a/<assetId> is the URL stored on NFC tags.
 * When opened in a browser (instead of the app), redirect to the asset dashboard.
 */
type Props = { params: Promise<{ id: string }> };

export default async function AssetDeepLinkPage({ params }: Props) {
  const { id } = await params;
  redirect(`/assets/${id}`);
}
