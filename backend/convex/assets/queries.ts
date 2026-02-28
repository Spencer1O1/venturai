import { v } from "convex/values";

import { query } from "../_generated/server";
import { DEFAULT_TEMPLATE } from "../lib/default_template";
import { assetDocValidator } from "./helpers";

/**
 * Get asset by ID.
 * The NFC tag stores the asset URL (e.g. venturai.app/a/<assetId>); when scanned, use this to load the asset.
 */
export const getById = query({
  args: { assetId: v.id("assets") },
  returns: v.union(assetDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assetId);
  },
});

/**
 * List assets by org, sorted by riskScore desc (highest risk first).
 */
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  returns: v.array(assetDocValidator),
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return assets.sort((a, b) => b.riskScore - a.riskScore);
  },
});

const templateForInspectionValidator = v.object({
  photoDescriptions: v.array(v.string()),
  additionalQuestions: v.array(
    v.object({
      key: v.string(),
      label: v.string(),
      type: v.string(),
    }),
  ),
});

/**
 * Get effective template for an asset (for inspection UI).
 * Uses asset's template when present; otherwise returns DEFAULT_TEMPLATE
 * (1 photo + no extra questions). Notes is always a built-in field.
 */
export const getTemplateForAsset = query({
  args: { assetId: v.id("assets") },
  returns: templateForInspectionValidator,
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");
    if (!asset.templateId) return DEFAULT_TEMPLATE;
    const t = await ctx.db.get(asset.templateId);
    if (!t)
      return DEFAULT_TEMPLATE;
    return {
      photoDescriptions: t.photoDescriptions,
      additionalQuestions: t.additionalQuestions.map((q) => ({
        key: q.key,
        label: q.label,
        type: q.type,
      })),
    };
  },
});

/**
 * Get asset by org and external ID (for legacy sync).
 */
export const getByExternalId = query({
  args: {
    orgId: v.id("orgs"),
    externalId: v.string(),
  },
  returns: v.union(assetDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_orgId_and_externalId", (q) =>
        q.eq("orgId", args.orgId).eq("externalId", args.externalId),
      )
      .unique();
  },
});
