import { v } from "convex/values";

import { query } from "../_generated/server";
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
