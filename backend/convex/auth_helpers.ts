import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * Get current user (if authenticated).
 * Role is per-org/per-group; use getUserRoleForAsset or isUserAdminOfOrg for context-specific checks.
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
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
    };
  },
});

/**
 * Check if the current user can access maintenance features for an asset.
 * True if: user is admin of the asset's org, or user is in the asset's maintenance group.
 */
export const isMaintenanceWorkerForAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return false;

    const userId = id.subject as Id<"users">;
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return false;

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

    if (orgMembership?.role === "admin") return true;
    if (mgMembership) return true;
    return false;
  },
});

/**
 * Get the current user's role for an asset (admin of org, or maintainer in group).
 * Used when recording who created an assessment.
 */
export const getUserRoleForAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.union(
    v.literal("admin"),
    v.literal("maintainer"),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const id = await ctx.auth.getUserIdentity();
    if (!id) return null;

    const userId = id.subject as Id<"users">;
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return null;

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

    if (orgMembership?.role === "admin") return "admin";
    if (mgMembership) return "maintainer";
    return null;
  },
});
