import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * Get current user with role (if authenticated).
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      role: v.optional(v.union(v.literal("admin"), v.literal("maintainer"))),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return null;
    const user = await ctx.db.get(id.subject as Id<"users">);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
});

/**
 * Check if the current user can access maintenance features for an asset.
 * True if: user is admin, or user is maintainer in the asset's maintenance group.
 */
export const isMaintenanceWorkerForAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return false;

    const userId = id.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    if (!user) return false;

    if (user.role === "admin") return true;

    if (user.role !== "maintainer") return false;

    const asset = await ctx.db.get(args.assetId);
    if (!asset) return false;

    const membership = await ctx.db
      .query("maintenanceGroupMembers")
      .withIndex("by_userId_and_maintenanceGroupId", (q) =>
        q
          .eq("userId", userId)
          .eq("maintenanceGroupId", asset.maintenanceGroupId),
      )
      .unique();

    return membership != null;
  },
});
