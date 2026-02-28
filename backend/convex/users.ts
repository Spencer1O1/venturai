import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Add maintainer to a maintenance group.
 * Caller must be admin of the org that owns the maintenance group.
 */
export const addMaintenanceGroupMember = mutation({
  args: {
    userId: v.id("users"),
    maintenanceGroupId: v.id("maintenanceGroups"),
  },
  returns: v.id("maintenanceGroupMembers"),
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");

    const group = await ctx.db.get(args.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");

    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", callerId).eq("orgId", group.orgId),
      )
      .unique();

    if (!callerMembership || callerMembership.role !== "admin") {
      throw new Error(
        "Must be admin of this org to add maintenance group members",
      );
    }

    const existing = await ctx.db
      .query("maintenanceGroupMembers")
      .withIndex("by_userId_and_maintenanceGroupId", (q) =>
        q
          .eq("userId", args.userId)
          .eq("maintenanceGroupId", args.maintenanceGroupId),
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("maintenanceGroupMembers", {
      userId: args.userId,
      maintenanceGroupId: args.maintenanceGroupId,
    });
  },
});
