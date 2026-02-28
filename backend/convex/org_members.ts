import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const orgWithRoleValidator = v.object({
  _id: v.id("orgs"),
  name: v.string(),
  role: v.union(v.literal("admin"), v.literal("member")),
});

/**
 * Get orgs the current user is an admin of.
 * Used to determine if user can register assets for an org.
 */
export const getOrgsUserIsAdminOf = query({
  args: {},
  returns: v.array(orgWithRoleValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject as Id<"users">;
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const result: Array<{ _id: Id<"orgs">; name: string; role: "admin" | "member" }> = [];
    for (const m of memberships) {
      if (m.role !== "admin") continue;
      const org = await ctx.db.get(m.orgId);
      if (org) result.push({ _id: org._id, name: org.name, role: "admin" });
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const userId = identity.subject as Id<"users">;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const callerMembership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", identity.subject as Id<"users">).eq("orgId", args.orgId),
      )
      .unique();

    if (!callerMembership || callerMembership.role !== "admin") {
      throw new Error("Must be admin of this org to add members");
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
