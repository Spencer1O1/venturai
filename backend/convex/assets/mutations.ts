import { v } from "convex/values";

import { mutation } from "../_generated/server";

/**
 * Create an asset.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    templateId: v.optional(v.id("assessmentTemplates")),
    name: v.string(),
    type: v.string(),
    locationText: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalSystem: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    serial: v.optional(v.string()),
  },
  returns: v.id("assets"),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");
    const group = await ctx.db.get(args.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");
    if (args.templateId) {
      const tpl = await ctx.db.get(args.templateId);
      if (!tpl) throw new Error("Template not found");
    }

    const now = Date.now();
    return await ctx.db.insert("assets", {
      orgId: args.orgId,
      maintenanceGroupId: args.maintenanceGroupId,
      templateId: args.templateId,
      name: args.name,
      type: args.type,
      locationText: args.locationText,
      externalId: args.externalId,
      externalSystem: args.externalSystem,
      manufacturer: args.manufacturer,
      model: args.model,
      serial: args.serial,
      riskLoad: 0,
      riskScore: 0,
      createdAt: now,
    });
  },
});
