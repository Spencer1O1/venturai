"use node";

/**
 * Venturai intelligence pipeline: AI-driven assessments.
 *
 * Flow: 1) Create assessment placeholder (mutation), 2) Load asset/template/open work item keys
 * (query) + resolve photo storage IDs to URLs (query), 3) Call vision LLM with images + metadata,
 * 4) Validate AI JSON (zod), 5) Finalize: save aiAnalysis, upsert work items per dedupe policy,
 * recompute asset riskLoad/riskScore (mutation), 6) Return aiAnalysis + updated risk fields.
 */

import { v } from "convex/values";

import { api, internal } from "../_generated/api";

const internalAny = internal as Record<string, Record<string, unknown>>;

function requireInternal(path: string): Record<string, unknown> {
  const mod = internalAny[path];
  if (!mod) throw new Error(`Internal module "${path}" not found`);
  return mod;
}

const im = requireInternal("assessments/internal_mutations");
const iq = requireInternal("assessments/internal_queries");

import { action } from "../_generated/server";
import { ANALYZERS } from "../ai_provider_adapter";
import { analyze } from "../ai_provider_adapter/analyze";
import { aiAnalysisValidator } from "../lib/ai_analysis_validator";

export const createWithAI = action({
  args: {
    assetId: v.id("assets"),
    intent: v.union(v.literal("routine"), v.literal("problem")),
    photoStorageIds: v.array(v.id("_storage")),
    photoDescriptions: v.array(v.string()),
    answers: v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    aiAnalysis: aiAnalysisValidator,
    riskLoad: v.number(),
    riskScore: v.number(),
    lastAssessedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const [user, roleForAsset] = await Promise.all([
      ctx.runQuery(api.auth_helpers.getCurrentUser),
      ctx.runQuery(api.auth_helpers.getUserRoleForAsset, {
        assetId: args.assetId,
      }),
    ]);
    const createdByRole = roleForAsset ?? undefined;
    const createdByUserId = user?._id;

    const assessmentId = await ctx.runMutation(
      im.createPlaceholder as Parameters<typeof ctx.runMutation>[0],
      {
        assetId: args.assetId,
        intent: args.intent,
        createdByRole,
        createdByUserId,
        photoStorageIds: args.photoStorageIds,
        photoDescriptions: args.photoDescriptions,
        answers: args.answers,
        notes: args.notes,
      },
    );

    const [imageUrls, context] = await Promise.all([
      ctx.runQuery(internal.storage.getImageUrls, {
        storageIds: args.photoStorageIds,
      }),
      ctx.runQuery(iq.loadContext as Parameters<typeof ctx.runQuery>[0], {
        assetId: args.assetId,
      }),
    ]);

    if (imageUrls.length === 0) {
      throw new Error("No valid image URLs; ensure photos are uploaded");
    }

    // loadContext returns DEFAULT_TEMPLATE when asset has no template (ensures at least 1 photo)
    const template = context.template;

    const payload = {
      imageUrls,
      assetMetadata: {
        assetName: context.asset.name,
        manufacturer: context.asset.manufacturer,
        model: context.asset.model,
        locationText: context.asset.locationText,
        externalId: context.asset.externalId,
        maintenanceGroupName: context.maintenanceGroupName,
      },
      template: {
        photoDescriptions: template.photoDescriptions,
        additionalQuestions: template.additionalQuestions,
      },
      answers: args.answers,
      notes: args.notes,
      intent: args.intent,
      existingOpenActionKeys: context.existingOpenActionKeys,
    };

    const { result: aiAnalysis } = await analyze(ANALYZERS.OpenAI, payload);

    await ctx.runMutation(
      im.finalizeWithAI as Parameters<typeof ctx.runMutation>[0],
      {
        assessmentId,
        assetId: args.assetId,
        aiAnalysis,
      },
    );

    const asset = await ctx.runQuery(
      iq.getAssetRisk as Parameters<typeof ctx.runQuery>[0],
      {
        assetId: args.assetId,
      },
    );
    if (!asset) throw new Error("Asset not found after finalize");

    return {
      aiAnalysis,
      riskLoad: asset.riskLoad,
      riskScore: asset.riskScore,
      lastAssessedAt: asset.lastAssessedAt ?? Date.now(),
    };
  },
});
