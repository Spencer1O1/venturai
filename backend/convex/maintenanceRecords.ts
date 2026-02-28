import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { computeRiskScoreFromLoad } from "./lib/utils";

/**
 * Create a maintenance record, close the selected work items, and recompute asset risk.
 * No AI involved.
 */
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    closedWorkItemIds: v.array(v.id("workItems")),
    createdByUserId: v.optional(v.string()),
    notes: v.optional(v.string()),
    afterPhotoStorageIds: v.optional(v.array(v.id("_storage"))),
    timeSpentMinutes: v.optional(v.number()),
  },
  returns: v.id("maintenanceRecords"),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const group = await ctx.db.get(args.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");

    const now = Date.now();

    const recordId = await ctx.db.insert("maintenanceRecords", {
      assetId: args.assetId,
      maintenanceGroupId: args.maintenanceGroupId,
      closedWorkItemIds: args.closedWorkItemIds,
      createdByUserId: args.createdByUserId,
      notes: args.notes,
      afterPhotoStorageIds: args.afterPhotoStorageIds,
      timeSpentMinutes: args.timeSpentMinutes,
      createdAt: now,
    });

    for (const wid of args.closedWorkItemIds) {
      const wi = await ctx.db.get(wid);
      if (wi && wi.status === "open" && wi.assetId === args.assetId) {
        await ctx.db.patch(wid, {
          status: "done",
          closedAt: now,
          closedByUserId: args.createdByUserId,
          closedByRecordId: recordId,
        });
      }
    }

    const openWorkItems = await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();

    const riskLoad = openWorkItems.reduce((sum, wi) => sum + wi.riskValue, 0);
    const riskScore = computeRiskScoreFromLoad(riskLoad);

    await ctx.db.patch(args.assetId, {
      riskLoad,
      riskScore,
    });

    return recordId;
  },
});
