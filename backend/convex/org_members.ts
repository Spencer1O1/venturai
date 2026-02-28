import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const orgRole = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

const orgWithRoleValidator = v.object({
  _id: v.id("orgs"),
  name: v.string(),
  role: orgRole,
});

function isAdminOrOwner(role: string): boolean {
  return role === "admin" || role === "owner";
}

/**
 * Get orgs the current user belongs to.
 */
export const getOrgsUserBelongsTo = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("orgs"),
      name: v.string(),
      role: orgRole,
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const result: Array<{
      _id: Id<"orgs">;
      name: string;
      role: "owner" | "admin" | "member";
    }> = [];
    for (const m of memberships) {
      const org = await ctx.db.get(m.orgId);
      if (org) result.push({ _id: org._id, name: org.name, role: m.role });
    }
    return result;
  },
});

/**
 * Get orgs the current user is an admin or owner of.
 * Used to determine if user can register assets for an org.
 */
export const getOrgsUserIsAdminOf = query({
  args: {},
  returns: v.array(orgWithRoleValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const result: Array<{
      _id: Id<"orgs">;
      name: string;
      role: "owner" | "admin" | "member";
    }> = [];
    for (const m of memberships) {
      if (!isAdminOrOwner(m.role)) continue;
      const org = await ctx.db.get(m.orgId);
      if (org) result.push({ _id: org._id, name: org.name, role: m.role });
    }
    return result;
  },
});

/**
 * List org members with user info. Caller must be admin or member of the org.
 */
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  returns: v.array(
    v.object({
      _id: v.id("orgMembers"),
      userId: v.id("users"),
      role: orgRole,
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    if (!membership) return [];

    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const result: Array<{
      _id: Id<"orgMembers">;
      userId: Id<"users">;
      role: "owner" | "admin" | "member";
      email?: string;
      name?: string;
    }> = [];

    for (const m of members) {
      const user = await ctx.db.get(m.userId);
      result.push({
        _id: m._id,
        userId: m.userId,
        role: m.role,
        email: user?.email,
        name: user?.name,
      });
    }

    return result;
  },
});

/**
 * Check if the current user is an admin of the given org.
 */
export const isUserAdminOfOrg = query({
  args: { orgId: v.id("orgs") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    return membership?.role === "admin";
  },
});

/**
 * Add a user as admin or member of an org.
 * Caller must be admin of that org.
 */
export const addOrgMember = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("orgs"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  returns: v.id("orgMembers"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    if (!callerMembership || !isAdminOrOwner(callerMembership.role)) {
      throw new Error("Must be admin or owner of this org to add members");
    }

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("orgMembers", {
      userId: args.userId,
      orgId: args.orgId,
      role: args.role,
    });
  },
});

/**
 * Remove a member from an org. Caller must be owner or admin.
 * Owners cannot be removed.
 */
export const removeOrgMember = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");

    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", callerId).eq("orgId", args.orgId),
      )
      .unique();

    if (!callerMembership || !isAdminOrOwner(callerMembership.role)) {
      throw new Error("Must be admin or owner of this org to remove members");
    }

    const targetMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .unique();

    if (!targetMembership) throw new Error("Member not found");

    if (targetMembership.role === "owner") {
      throw new Error("Cannot remove the organization owner");
    }

    await ctx.db.delete(targetMembership._id);

    const groups = await ctx.db
      .query("maintenanceGroups")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    for (const group of groups) {
      const mgMembership = await ctx.db
        .query("maintenanceGroupMembers")
        .withIndex("by_userId_and_maintenanceGroupId", (q) =>
          q
            .eq("userId", args.userId)
            .eq("maintenanceGroupId", group._id),
        )
        .unique();
      if (mgMembership) {
        await ctx.db.delete(mgMembership._id);
      }
    }

    return null;
  },
});
