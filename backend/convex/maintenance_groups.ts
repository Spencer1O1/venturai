import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const maintenanceGroupValidator = v.object({
  _id: v.id("maintenanceGroups"),
  _creationTime: v.number(),
  orgId: v.id("orgs"),
  name: v.string(),
  createdAt: v.number(),
});

/**
 * List maintenance groups for an org.
 */
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  returns: v.array(maintenanceGroupValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maintenanceGroups")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

/**
 * List maintainers in a group. Caller must be admin of the org.
 */
export const listMaintainers = query({
  args: { maintenanceGroupId: v.id("maintenanceGroups") },
  returns: v.array(
    v.object({
      _id: v.id("maintenanceGroupMembers"),
      userId: v.id("users"),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const group = await ctx.db.get(args.maintenanceGroupId);
    if (!group) return [];

    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", group.orgId),
      )
      .unique();

    if (
      !callerMembership ||
      (callerMembership.role !== "admin" && callerMembership.role !== "owner")
    )
      return [];

    const members = await ctx.db
      .query("maintenanceGroupMembers")
      .withIndex("by_maintenanceGroupId", (q) =>
        q.eq("maintenanceGroupId", args.maintenanceGroupId),
      )
      .collect();

    const result: Array<{
      _id: Id<"maintenanceGroupMembers">;
      userId: Id<"users">;
      email?: string;
      name?: string;
    }> = [];

    for (const m of members) {
      const user = await ctx.db.get(m.userId);
      result.push({
        _id: m._id,
        userId: m.userId,
        email: user?.email,
        name: user?.name,
      });
    }

    return result;
  },
});

/**
 * Remove maintainer from a group. Caller must be admin of the org.
 */
export const removeMaintainer = mutation({
  args: {
    maintenanceGroupId: v.id("maintenanceGroups"),
    userId: v.id("users"),
  },
  returns: v.null(),
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
      throw new Error("Must be admin to remove maintainers");
    }

    const membership = await ctx.db
      .query("maintenanceGroupMembers")
      .withIndex("by_userId_and_maintenanceGroupId", (q) =>
        q
          .eq("userId", args.userId)
          .eq("maintenanceGroupId", args.maintenanceGroupId),
      )
      .unique();

    if (membership) {
      await ctx.db.delete(membership._id);
    }

    return null;
  },
});

/**
 * Create a maintenance group for an org.
 * Caller must be admin of that org.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
  },
  returns: v.id("maintenanceGroups"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "owner")
    ) {
      throw new Error(
        "Must be admin or owner of this org to create maintenance groups",
      );
    }

    const now = Date.now();
    return await ctx.db.insert("maintenanceGroups", {
      orgId: args.orgId,
      name: args.name,
      createdAt: now,
    });
  },
});
