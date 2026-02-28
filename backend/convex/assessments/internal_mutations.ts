import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import type { AIOutput } from "../ai_provider_adapter/ai_output_schema";
import { aiOutputValidator } from "../lib/ai_output_validator";
import {
  computeRiskScoreFromLoad,
  normalizeActionKey,
  shouldCreateWorkItem,
} from "../lib/utils";

/**
 * Create assessment placeholder (before AI call).
 */
export const createPlaceholder = internalMutation({
  args: {
    assetId: v.id("assets"),
    intent: v.union(v.literal("routine"), v.literal("problem")),
    /** If undefined, created by anonymous/unauthenticated user */
    createdByRole: v.optional(
      v.union(v.literal("admin"), v.literal("maintainer")),
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
 * Finalize assessment: save aiOutput, upsert work items, recompute asset risk.
 */
export const finalizeWithAI = internalMutation({
  args: {
    assessmentId: v.id("assessments"),
    assetId: v.id("assets"),
    aiOutput: aiOutputValidator,
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
