import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import type { AIOutput } from "./ai_provider_adapter/ai_output_schema";
import {
  computeRiskScoreFromLoad,
  normalizeActionKey,
  shouldCreateWorkItem,
} from "./lib/utils";

/**
 * Create assessment placeholder (before AI call).
 */
export const createPlaceholder = internalMutation({
  args: {
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
  },
  returns: v.id("assessments"),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const now = Date.now();
    return await ctx.db.insert("assessments", {
      assetId: args.assetId,
      intent: args.intent,
      createdByRole: args.createdByRole,
      createdByUserId: args.createdByUserId,
      photoStorageIds: args.photoStorageIds,
      photoDescriptions: args.photoDescriptions,
      answers: args.answers,
      notes: args.notes,
      createdAt: now,
    });
  },
});

/**
 * Load context for AI: asset, template, maintenance group name, open action keys.
 */
export const loadContext = internalQuery({
  args: {
    assetId: v.id("assets"),
  },
  returns: v.object({
    asset: v.object({
      _id: v.id("assets"),
      name: v.string(),
      type: v.string(),
      manufacturer: v.optional(v.string()),
      model: v.optional(v.string()),
      locationText: v.optional(v.string()),
      externalId: v.optional(v.string()),
      maintenanceGroupId: v.id("maintenanceGroups"),
    }),
    template: v.union(
      v.object({
        photoDescriptions: v.array(v.string()),
        additionalQuestions: v.array(
          v.object({
            key: v.string(),
            label: v.string(),
            type: v.string(),
          }),
        ),
      }),
      v.null(),
    ),
    maintenanceGroupName: v.string(),
    existingOpenActionKeys: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    const group = await ctx.db.get(asset.maintenanceGroupId);
    if (!group) throw new Error("Maintenance group not found");

    let template: {
      photoDescriptions: string[];
      additionalQuestions: Array<{ key: string; label: string; type: string }>;
    } | null = null;
    if (asset.templateId) {
      const t = await ctx.db.get(asset.templateId);
      if (t) {
        template = {
          photoDescriptions: t.photoDescriptions,
          additionalQuestions: t.additionalQuestions.map((q) => ({
            key: q.key,
            label: q.label,
            type: q.type,
          })),
        };
      }
    }

    const openWorkItems = await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();

    const existingOpenActionKeys = openWorkItems.map((wi) => wi.actionKey);

    return {
      asset: {
        _id: asset._id,
        name: asset.name,
        type: asset.type,
        manufacturer: asset.manufacturer,
        model: asset.model,
        locationText: asset.locationText,
        externalId: asset.externalId,
        maintenanceGroupId: asset.maintenanceGroupId,
      },
      template,
      maintenanceGroupName: group.name,
      existingOpenActionKeys,
    };
  },
});

/**
 * Finalize assessment: save aiOutput, upsert work items, recompute asset risk.
 */
export const finalizeWithAI = internalMutation({
  args: {
    assessmentId: v.id("assessments"),
    assetId: v.id("assets"),
    aiOutput: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const output = args.aiOutput as AIOutput;
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    await ctx.db.patch(args.assessmentId, { aiOutput: output });

    const now = Date.now();
    const openWorkItems = await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();

    const byActionKey = new Map<string, (typeof openWorkItems)[0]>();
    for (const wi of openWorkItems) {
      byActionKey.set(wi.actionKey, wi);
    }

    for (const action of output.actions) {
      const priorityScore = Math.max(0, Math.min(1, action.priority));
      const riskValue = Math.max(
        0,
        Math.min(100, Math.round(action.risk_value)),
      );

      if (!shouldCreateWorkItem(riskValue, priorityScore)) continue;

      const actionKey = normalizeActionKey(action.suggested_key);
      const existing = byActionKey.get(actionKey);

      if (existing) {
        await ctx.db.patch(existing._id, {
          lastSeenAt: now,
          evidenceCount: existing.evidenceCount + 1,
          lastEvidenceAssessmentId: args.assessmentId,
          priorityScore: Math.max(existing.priorityScore, priorityScore),
          riskValue: Math.max(existing.riskValue, riskValue),
        });
        byActionKey.set(actionKey, {
          ...existing,
          evidenceCount: existing.evidenceCount + 1,
          lastSeenAt: now,
          priorityScore: Math.max(existing.priorityScore, priorityScore),
          riskValue: Math.max(existing.riskValue, riskValue),
        });
      } else {
        const newId = await ctx.db.insert("workItems", {
          assetId: args.assetId,
          actionKey,
          title: action.title,
          status: "open",
          priorityScore,
          riskValue,
          evidenceCount: 1,
          firstSeenAt: now,
          lastSeenAt: now,
          lastEvidenceAssessmentId: args.assessmentId,
        });
        const newDoc = await ctx.db.get(newId);
        if (newDoc) byActionKey.set(actionKey, newDoc);
      }
    }

    const updatedOpen = await ctx.db
      .query("workItems")
      .withIndex("by_assetId_and_status", (q) =>
        q.eq("assetId", args.assetId).eq("status", "open"),
      )
      .collect();

    const riskLoad = updatedOpen.reduce((sum, wi) => sum + wi.riskValue, 0);
    const riskScore = computeRiskScoreFromLoad(riskLoad);

    await ctx.db.patch(args.assetId, {
      riskLoad,
      riskScore,
      lastAssessedAt: now,
    });

    return null;
  },
});

/**
 * Get asset risk fields (for action return).
 */
export const getAssetRisk = internalQuery({
  args: { assetId: v.id("assets") },
  returns: v.union(
    v.object({
      riskLoad: v.number(),
      riskScore: v.number(),
      lastAssessedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) return null;
    return {
      riskLoad: asset.riskLoad,
      riskScore: asset.riskScore,
      lastAssessedAt: asset.lastAssessedAt,
    };
  },
});
