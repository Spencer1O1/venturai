import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Additional question for assessment templates
const additionalQuestionValidator = v.object({
  key: v.string(),
  label: v.string(),
  type: v.union(v.literal("text"), v.literal("number"), v.literal("boolean")),
});

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("admin"), v.literal("maintainer"))),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  /** Maintainers are assigned to specific maintenance groups */
  maintenanceGroupMembers: defineTable({
    userId: v.id("users"),
    maintenanceGroupId: v.id("maintenanceGroups"),
  })
    .index("by_userId", ["userId"])
    .index("by_maintenanceGroupId", ["maintenanceGroupId"])
    .index("by_userId_and_maintenanceGroupId", [
      "userId",
      "maintenanceGroupId",
    ]),

  orgs: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  maintenanceGroups: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_orgId", ["orgId"]),

  assessmentTemplates: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    photoDescriptions: v.array(v.string()),
    additionalQuestions: v.array(additionalQuestionValidator),
    createdAt: v.number(),
  }).index("by_orgId", ["orgId"]),

  assets: defineTable({
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
  })
    .index("by_orgId", ["orgId"])
    .index("by_maintenanceGroupId", ["maintenanceGroupId"])
    .index("by_orgId_and_externalId", ["orgId", "externalId"]),

  assessments: defineTable({
    assetId: v.id("assets"),
    intent: v.union(v.literal("routine"), v.literal("problem")),
    createdByRole: v.union(
      v.literal("user"),
      v.literal("inspector"),
      v.literal("maintainer"),
    ),
    createdByUserId: v.optional(v.string()),
    photoStorageIds: v.array(v.id("_storage")),
    photoDescriptions: v.array(v.string()),
    answers: v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    notes: v.optional(v.string()),
    aiOutput: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_assetId", ["assetId"])
    .index("by_assetId_and_createdAt", ["assetId", "createdAt"]),

  workItems: defineTable({
    assetId: v.id("assets"),
    actionKey: v.string(),
    title: v.string(),
    status: v.union(v.literal("open"), v.literal("done")),
    priorityScore: v.number(),
    riskValue: v.number(),
    evidenceCount: v.number(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastEvidenceAssessmentId: v.id("assessments"),
    closedAt: v.optional(v.number()),
    closedByUserId: v.optional(v.string()),
    closedByRecordId: v.optional(v.id("maintenanceRecords")),
  })
    .index("by_assetId", ["assetId"])
    .index("by_assetId_and_actionKey", ["assetId", "actionKey"])
    .index("by_assetId_and_status", ["assetId", "status"])
    .index("by_status", ["status"]),

  maintenanceRecords: defineTable({
    assetId: v.id("assets"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    closedWorkItemIds: v.array(v.id("workItems")),
    createdByUserId: v.optional(v.string()),
    notes: v.optional(v.string()),
    afterPhotoStorageIds: v.optional(v.array(v.id("_storage"))),
    timeSpentMinutes: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_assetId", ["assetId"]),
});
