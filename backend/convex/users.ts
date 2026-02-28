import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

/**
 * Set user role (admin only). Used to promote users to admin or maintainer.
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("maintainer")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) throw new Error("Not authenticated");

    const callerUser = await ctx.db.get(caller.subject as Id<"users">);
    if (!callerUser || callerUser.role !== "admin") {
      throw new Error("Only admins can set roles");
    }

    await ctx.db.patch(args.userId, { role: args.role });
    return null;
  },
});

/**
 * Add maintainer to a maintenance group (admin only).
 */
export const addMaintenanceGroupMember = mutation({
  args: {
    userId: v.id("users"),
    maintenanceGroupId: v.id("maintenanceGroups"),
  },
  returns: v.id("maintenanceGroupMembers"),
  handler: async (ctx, args) => {
    const caller = await ctx.auth.getUserIdentity();
    if (!caller) throw new Error("Not authenticated");

    const callerUser = await ctx.db.get(caller.subject as Id<"users">);
    if (!callerUser || callerUser.role !== "admin") {
      throw new Error("Only admins can add maintenance group members");
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
