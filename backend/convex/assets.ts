import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const assetDocValidator = v.object({
  _id: v.id("assets"),
  _creationTime: v.number(),
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
  riskLoad: v.number(),
  riskScore: v.number(),
  lastAssessedAt: v.optional(v.number()),
  createdAt: v.number(),
});

/**
 * Get asset by ID.
 */
export const getById = query({
  args: { assetId: v.id("assets") },
  returns: v.union(assetDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assetId);
  },
});

/**
 * List assets by org, sorted by riskScore desc (highest risk first).
 */
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  returns: v.array(assetDocValidator),
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    return assets.sort((a, b) => b.riskScore - a.riskScore);
  },
});

/**
 * Get asset by org and external ID (for legacy sync).
 */
export const getByExternalId = query({
  args: {
    orgId: v.id("orgs"),
    externalId: v.string(),
  },
  returns: v.union(assetDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_orgId_and_externalId", (q) =>
        q.eq("orgId", args.orgId).eq("externalId", args.externalId),
      )
      .unique();
  },
});

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
