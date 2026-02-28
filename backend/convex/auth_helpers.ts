import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
    };
  },
});

/**
 * Check if the current user is a member of the asset's organization (any role).
 * True if: user has orgMembers entry for the asset's org (owner, admin, or member).
 */
export const isMemberOfAssetOrg = query({
  args: { assetId: v.id("assets") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return false;

    const orgMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", asset.orgId),
      )
      .unique();

    return orgMembership !== null;
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
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

    if (
      orgMembership?.role === "admin" ||
      orgMembership?.role === "owner"
    )
      return true;
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
  returns: v.union(v.literal("admin"), v.literal("maintainer"), v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
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

    if (
      orgMembership?.role === "admin" ||
      orgMembership?.role === "owner"
    )
      return "admin";
    if (mgMembership) return "maintainer";
    return null;
  },
});
