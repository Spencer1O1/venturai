import { v } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Migration: Add an owner to an organization that has no members.
 * Use when an org was created (e.g. via seed or import) without any users.
 * Run from Convex dashboard or CLI. No auth required.
 */
export const addOwnerToOrphanedOrg = mutation({
  args: {
    orgId: v.id("orgs"),
    userId: v.id("users"),
  },
  returns: v.id("orgMembers"),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingMembers = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    if (existingMembers.length > 0) {
      throw new Error(
        "Organization already has members. Use orgMembers.addOrgMember to add users, or ensure the org has no members first.",
      );
    }

    const membershipId = await ctx.db.insert("orgMembers", {
      userId: args.userId,
      orgId: args.orgId,
      role: "owner",
    });

    return membershipId;
  },
});
