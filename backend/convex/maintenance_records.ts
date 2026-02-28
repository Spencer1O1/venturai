import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { computeRiskScoreFromLoad } from "./lib/utils";

/**
 * Create a maintenance record, close the selected work items, and recompute asset risk.
 * Requires: authenticated user who is admin or maintainer in the asset's maintenance group.
 */
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    closedWorkItemIds: v.array(v.id("workItems")),
    notes: v.optional(v.string()),
    afterPhotoStorageIds: v.optional(v.array(v.id("_storage"))),
    timeSpentMinutes: v.optional(v.number()),
  },
  returns: v.id("maintenanceRecords"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const group = await ctx.db.get(args.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");

    const [orgMembership, mgMembership] = await Promise.all([
      ctx.db
        .query("orgMembers")
        .withIndex("by_userId_and_orgId", (q) =>
          q.eq("userId", userId).eq("orgId", asset.orgId),
        )
        .unique(),
      ctx.db
        .query("maintenanceGroupMembers")
        .withIndex("by_userId_and_maintenanceGroupId", (q) =>
          q
            .eq("userId", userId)
            .eq("maintenanceGroupId", asset.maintenanceGroupId),
        )
        .unique(),
    ]);

    const isAdmin = orgMembership?.role === "admin";
    const isMaintainerInGroup = mgMembership != null;

    if (!isAdmin && !isMaintainerInGroup) {
      throw new Error(
        "Must be admin of this org or maintainer in this asset's group",
      );
    }

    const now = Date.now();

    const recordId = await ctx.db.insert("maintenanceRecords", {
      assetId: args.assetId,
      maintenanceGroupId: args.maintenanceGroupId,
      closedWorkItemIds: args.closedWorkItemIds,
      createdByUserId: userId,
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
          closedByUserId: userId,
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
