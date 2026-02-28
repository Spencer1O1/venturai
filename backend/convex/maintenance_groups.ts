import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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

    if (!membership || membership.role !== "admin") {
      throw new Error("Must be admin of this org to create maintenance groups");
    }

    const now = Date.now();
    return await ctx.db.insert("maintenanceGroups", {
      orgId: args.orgId,
      name: args.name,
      createdAt: now,
    });
  },
});
