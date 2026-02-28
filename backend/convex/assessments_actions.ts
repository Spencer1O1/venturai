"use node";

/**
 * Venturai intelligence pipeline: AI-driven assessments.
 *
 * Flow: 1) Create assessment placeholder (mutation), 2) Load asset/template/open work item keys
 * (query) + resolve photo storage IDs to URLs (query), 3) Call vision LLM with images + metadata,
 * 4) Validate AI JSON (zod), 5) Finalize: save aiOutput, upsert work items per dedupe policy,
 * recompute asset riskLoad/riskScore (mutation), 6) Return aiOutput + updated risk fields.
 */

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { ANALYZERS } from "./ai_provider_adapter";
import { analyze } from "./ai_provider_adapter/analyze";

export const createWithAI = action({
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
  returns: v.object({
    aiOutput: v.any(),
    riskLoad: v.number(),
    riskScore: v.number(),
    lastAssessedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const assessmentId = await ctx.runMutation(
      (internal as any).assessments_internal.createPlaceholder,
      {
        assetId: args.assetId,
        intent: args.intent,
        createdByRole: args.createdByRole,
        createdByUserId: args.createdByUserId,
        photoStorageIds: args.photoStorageIds,
        photoDescriptions: args.photoDescriptions,
        answers: args.answers,
        notes: args.notes,
      },
    );

    const [imageUrls, context] = await Promise.all([
      ctx.runQuery((internal as any).storage.getImageUrls, {
        storageIds: args.photoStorageIds,
      }),
      ctx.runQuery((internal as any).assessments_internal.loadContext, {
        assetId: args.assetId,
      }),
    ]);

    if (imageUrls.length === 0) {
      throw new Error("No valid image URLs; ensure photos are uploaded");
    }

    const template = context.template ?? {
      photoDescriptions: [] as string[],
      additionalQuestions: [] as Array<{
        key: string;
        label: string;
        type: string;
      }>,
    };

    const payload = {
      imageUrls,
      assetMetadata: {
        assetName: context.asset.name,
        assetType: context.asset.type,
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

    const { result: aiOutput } = await analyze(ANALYZERS.OpenAI, payload);

    await ctx.runMutation(
      (internal as any).assessments_internal.finalizeWithAI,
      {
        assessmentId,
        assetId: args.assetId,
        aiOutput,
      },
    );

    const asset = await ctx.runQuery(
      (internal as any).assessments_internal.getAssetRisk,
      {
        assetId: args.assetId,
      },
    );
    if (!asset) throw new Error("Asset not found after finalize");

    return {
      aiOutput,
      riskLoad: asset.riskLoad,
      riskScore: asset.riskScore,
      lastAssessedAt: asset.lastAssessedAt ?? Date.now(),
    };
  },
});
