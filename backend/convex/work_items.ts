import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

const workItemDocValidator = v.object({
  _id: v.id("workItems"),
  _creationTime: v.number(),
  assetId: v.id("assets"),
  actionKey: v.string(),
  title: v.string(),
  status: v.union(v.literal("open"), v.literal("done")),
  priorityScore: v.number(),
  riskValue: v.number(),
  evidenceCount: v.number(),
  firstSeenAt: v.number(),
  lastSeenAt: v.number(),
  lastEvidenceAssessmentId: v.id("assessments"),
  closedAt: v.optional(v.number()),
  closedByUserId: v.optional(v.string()),
  closedByRecordId: v.optional(v.id("maintenanceRecords")),
});

/**
 * Get a single work item by ID.
 */
export const getById = query({
  args: { workItemId: v.id("workItems") },
  returns: v.union(workItemDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workItemId);
  },
});

/**
 * List open work items for an asset.
 */
export const listOpenByAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.array(workItemDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();
  },
});

/**
 * List open work items for an org (all assets in org) or a maintenance group.
 * Sorted by riskValue desc.
 */
export const listOpenByOrgOrGroup = query({
  args: {
    orgId: v.optional(v.id("orgs")),
    maintenanceGroupId: v.optional(v.id("maintenanceGroups")),
  },
  returns: v.array(workItemDocValidator),
  handler: async (ctx, args) => {
    const { orgId, maintenanceGroupId } = args;
    if (!orgId && !maintenanceGroupId) {
      throw new Error("Provide orgId or maintenanceGroupId");
    }

    let assetIds: Id<"assets">[];
    if (maintenanceGroupId) {
      const assets = await ctx.db
        .query("assets")
        .withIndex("by_maintenanceGroupId", (q) =>
          q.eq("maintenanceGroupId", maintenanceGroupId),
        )
        .collect();
      assetIds = assets.map((a) => a._id);
    } else {
      if (!orgId) throw new Error("Provide orgId or maintenanceGroupId");
      const assets = await ctx.db
        .query("assets")
        .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
        .collect();
      assetIds = assets.map((a) => a._id);
    }

    const allWorkItems: Doc<"workItems">[] = [];
    for (const assetId of assetIds) {
      const items = await ctx.db
        .query("workItems")
        .withIndex("by_assetId_and_status", (q) =>
          q.eq("assetId", assetId).eq("status", "open"),
        )
        .collect();
      allWorkItems.push(...items);
    }

    return allWorkItems.sort((a, b) => b.riskValue - a.riskValue);
  },
});
