"use node";

import { v } from "convex/values";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";
import { ASSET_SUGGESTERS, suggestAsset } from "../ai_provider_adapter";

const internalAny = internal as Record<string, Record<string, unknown>>;

function requireInternal(path: string): Record<string, unknown> {
  const mod = internalAny[path];
  if (!mod) throw new Error(`Internal module "${path}" not found`);
  return mod;
}

const storage = requireInternal("storage");

/**
 * AI suggests asset details from a photo.
 * User must be admin of the org. Maintenance group must be from that org.
 */
export const suggestFromPhoto = action({
  args: {
    orgId: v.id("orgs"),
    photoStorageId: v.id("_storage"),
  },
  returns: v.object({
    name: v.string(),
    maintenanceGroupId: v.id("maintenanceGroups"),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    serial: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiAny = api as Record<string, Record<string, unknown>>;
    const [canAdmin, imageUrls, groups] = (await Promise.all([
      ctx.runQuery(
        (apiAny as { org_members: { isUserAdminOfOrg: unknown } }).org_members
          .isUserAdminOfOrg as Parameters<typeof ctx.runQuery>[0],
        { orgId: args.orgId },
      ),
      ctx.runQuery(storage.getImageUrls as Parameters<typeof ctx.runQuery>[0], {
        storageIds: [args.photoStorageId],
      }),
      ctx.runQuery(
        (apiAny as { maintenance_groups: { listByOrg: unknown } })
          .maintenance_groups.listByOrg as Parameters<typeof ctx.runQuery>[0],
        { orgId: args.orgId },
      ),
    ])) as [
      boolean,
      string[],
      Array<{ _id: Id<"maintenanceGroups">; name: string }>,
    ];

    if (!canAdmin)
      throw new Error("Must be admin of this org to register assets");
    if (!imageUrls?.length) throw new Error("Could not resolve image URL");
    if (!groups?.length)
      throw new Error("Org has no maintenance groups; create one first");

    const imageUrl = imageUrls[0];
    if (!imageUrl) throw new Error("No image URL");
    const { result: suggestion } = await suggestAsset(ASSET_SUGGESTERS.OpenAI, {
      imageUrl,
      maintenanceGroups: groups.map((g) => ({ _id: g._id, name: g.name })),
    });

    const validGroup =
      groups.find((g) => g._id === suggestion.maintenance_group_id) ??
      groups.find(
        (g) =>
          g.name.toLowerCase() ===
          suggestion.maintenance_group_id.toLowerCase(),
      );
    if (!validGroup) {
      throw new Error(
        `AI suggested invalid maintenance group "${suggestion.maintenance_group_id}". Use one of: ${groups.map((g) => `${g.name} (${g._id})`).join(", ")}`,
      );
    }

    return {
      name: suggestion.name,
      maintenanceGroupId: validGroup._id,
      manufacturer: suggestion.manufacturer,
      model: suggestion.model,
      serial: suggestion.serial,
    };
  },
});
