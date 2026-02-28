import { v } from "convex/values";

import { internalQuery } from "../_generated/server";

/**
 * Load context for AI: asset, template, maintenance group name, open action keys.
 */
export const loadContext = internalQuery({
  args: {
    assetId: v.id("assets"),
  },
  returns: v.object({
    asset: v.object({
      _id: v.id("assets"),
      name: v.string(),
      type: v.string(),
      manufacturer: v.optional(v.string()),
      model: v.optional(v.string()),
      locationText: v.optional(v.string()),
      externalId: v.optional(v.string()),
      maintenanceGroupId: v.id("maintenanceGroups"),
    }),
    template: v.union(
      v.object({
        photoDescriptions: v.array(v.string()),
        additionalQuestions: v.array(
          v.object({
            key: v.string(),
            label: v.string(),
            type: v.string(),
          }),
        ),
      }),
      v.null(),
    ),
    maintenanceGroupName: v.string(),
    existingOpenActionKeys: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const group = await ctx.db.get(asset.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");

    let template: {
      photoDescriptions: string[];
      additionalQuestions: Array<{ key: string; label: string; type: string }>;
    } | null = null;
    if (asset.templateId) {
      const t = await ctx.db.get(asset.templateId);
      if (t) {
        template = {
          photoDescriptions: t.photoDescriptions,
          additionalQuestions: t.additionalQuestions.map((q) => ({
            key: q.key,
            label: q.label,
            type: q.type,
          })),
        };
      }
    }

    const openWorkItems = await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();

    const existingOpenActionKeys = openWorkItems.map((wi) => wi.actionKey);

    return {
      asset: {
        _id: asset._id,
        name: asset.name,
        type: asset.type,
        manufacturer: asset.manufacturer,
        model: asset.model,
        locationText: asset.locationText,
        externalId: asset.externalId,
        maintenanceGroupId: asset.maintenanceGroupId,
      },
      template,
      maintenanceGroupName: group.name,
      existingOpenActionKeys,
    };
  },
});

/**
 * Get asset risk fields (for action return).
 */
export const getAssetRisk = internalQuery({
  args: { assetId: v.id("assets") },
  returns: v.union(
    v.object({
      riskLoad: v.number(),
      riskScore: v.number(),
      lastAssessedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return null;
    return {
      riskLoad: asset.riskLoad,
      riskScore: asset.riskScore,
      lastAssessedAt: asset.lastAssessedAt,
    };
  },
});
