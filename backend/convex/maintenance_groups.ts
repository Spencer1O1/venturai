import { v } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Create a maintenance group for an org.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
  },
  returns: v.id("maintenanceGroups"),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

    const now = Date.now();
    return await ctx.db.insert("maintenanceGroups", {
      orgId: args.orgId,
      name: args.name,
      createdAt: now,
    });
  },
});
