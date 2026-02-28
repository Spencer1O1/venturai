import { v } from "convex/values";

export const assetDocValidator = v.object({
  _id: v.id("assets"),
  _creationTime: v.number(),
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
  riskLoad: v.number(),
  riskScore: v.number(),
  lastAssessedAt: v.optional(v.number()),
  createdAt: v.number(),
});
