import { v } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Seed dev data: one org, one maintenance group, one template, one asset.
 * Optional helper for local development.
 */
export const seed = mutation({
  args: {},
  returns: v.object({
    orgId: v.id("orgs"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    templateId: v.id("assessmentTemplates"),
    assetId: v.id("assets"),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    const orgId = await ctx.db.insert("orgs", {
      name: "Demo Org",
      createdAt: now,
    });

    const maintenanceGroupId = await ctx.db.insert("maintenanceGroups", {
      orgId,
      name: "Pump Bay A",
      createdAt: now,
    });

    const templateId = await ctx.db.insert("assessmentTemplates", {
      orgId,
      name: "Pump Inspection",
      photoDescriptions: [
        "Wide shot of asset",
        "Close-up of suspected wear area",
      ],
      additionalQuestions: [
        { key: "vibration", label: "Vibration level (1-5)", type: "number" },
        { key: "noise", label: "Unusual noise?", type: "boolean" },
      ],
      createdAt: now,
    });

    const assetId = await ctx.db.insert("assets", {
      orgId,
      maintenanceGroupId,
      templateId,
      name: "Diaphragm Pump #1",
      locationText: "Bay A, North wall",
      manufacturer: "Example Mfg",
      model: "DP-100",
      riskLoad: 0,
      riskScore: 0,
      createdAt: now,
    });

    return { orgId, maintenanceGroupId, templateId, assetId };
  },
});
