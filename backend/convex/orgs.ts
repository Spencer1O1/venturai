import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/**
 * Get the first org (or default). For single-org setups.
 */
export const getDefaultOrFirst = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("orgs"),
      _creationTime: v.number(),
      name: v.string(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const org = await ctx.db.query("orgs").first();
    return org;
  },
});

/**
 * Create an org. The creator becomes the owner.
 */
export const create = mutation({
  args: { name: v.string() },
  returns: v.id("orgs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      name: args.name,
      createdAt: now,
    });

    await ctx.db.insert("orgMembers", {
      userId,
      orgId,
      role: "owner",
    });

    return orgId;
  },
});
