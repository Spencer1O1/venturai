import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation } from "../_generated/server";

/**
 * Create an asset.
 * After creation, write the asset URL (venturai.app/a/<assetId>) to the NFC tag.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    templateId: v.optional(v.id("assessmentTemplates")),
    name: v.string(),
    locationText: v.optional(v.string()),
    externalId: v.optional(v.string()),
    externalSystem: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    model: v.optional(v.string()),
    serial: v.optional(v.string()),
  },
  returns: v.id("assets"),
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
      membership?.role !== "admin" &&
      membership?.role !== "owner"
    ) {
      throw new Error(
        "Must be admin or owner of this org to create assets",
      );
    }
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

/**
 * Update an asset's template. Caller must be admin of the asset's org.
 */
export const updateTemplate = mutation({
  args: {
    assetId: v.id("assets"),
    templateId: v.optional(v.id("assessmentTemplates")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", asset.orgId),
      )
      .unique();

    if (
      membership?.role !== "admin" &&
      membership?.role !== "owner"
    )
      throw new Error("Must be admin or owner of this org");

    if (args.templateId) {
      const tpl = await ctx.db.get(args.templateId);
      if (!tpl || tpl.orgId !== asset.orgId) {
        throw new Error("Template not found or wrong org");
      }
    }

    await ctx.db.patch(args.assetId, { templateId: args.templateId });
    return null;
  },
});
