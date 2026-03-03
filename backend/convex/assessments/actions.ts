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

import type { Id } from "../_generated/dataModel";
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

/**
 * Dev/seed only: run the assessment AI pipeline for multiple assets in one call.
 * Used by the seed script so it only needs to invoke the CLI once (avoids Windows
 * spawn/arg issues with per-asset convex run).
 */
export const runAllAssessmentsForSeed = action({
  args: {
    assets: v.array(
      v.object({
        assetId: v.id("assets"),
        photoStorageIds: v.array(v.id("_storage")),
        photoDescriptions: v.array(v.string()),
        answers: v.record(
          v.string(),
          v.union(v.string(), v.number(), v.boolean()),
        ),
        notes: v.optional(v.string()),
        intent: v.optional(
          v.union(v.literal("routine"), v.literal("problem")),
        ),
      }),
    ),
  },
  returns: v.array(
    v.object({
      assetId: v.id("assets"),
      riskLoad: v.number(),
      riskScore: v.number(),
      lastAssessedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const results: {
      assetId: Id<"assets">;
      riskLoad: number;
      riskScore: number;
      lastAssessedAt: number;
    }[] = [];
    for (const asset of args.assets) {
      const intent = asset.intent ?? "routine";
      const assessmentId = await ctx.runMutation(
        im.createPlaceholder as Parameters<typeof ctx.runMutation>[0],
        {
          assetId: asset.assetId,
          intent,
          createdByRole: "maintainer",
          createdByUserId: "synthetic-seed",
          photoStorageIds: asset.photoStorageIds,
          photoDescriptions: asset.photoDescriptions,
          answers: asset.answers,
          notes: asset.notes,
        },
      );

      const [imageUrls, context] = await Promise.all([
        ctx.runQuery(internal.storage.getImageUrls, {
          storageIds: asset.photoStorageIds,
        }),
        ctx.runQuery(iq.loadContext as Parameters<typeof ctx.runQuery>[0], {
          assetId: asset.assetId,
        }),
      ]);

      if (imageUrls.length === 0) {
        throw new Error(
          `No valid image URLs for asset ${asset.assetId}; ensure photos are uploaded`,
        );
      }

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
        answers: asset.answers,
        notes: asset.notes,
        intent: (asset.intent ?? "routine") as "routine" | "problem",
        existingOpenActionKeys: context.existingOpenActionKeys,
      };

      const { result: aiAnalysis } = await analyze(ANALYZERS.OpenAI, payload);

      await ctx.runMutation(
        im.finalizeWithAI as Parameters<typeof ctx.runMutation>[0],
        {
          assessmentId,
          assetId: asset.assetId,
          aiAnalysis,
        },
      );

      const a = await ctx.runQuery(
        iq.getAssetRisk as Parameters<typeof ctx.runQuery>[0],
        { assetId: asset.assetId },
      );
      if (!a) throw new Error("Asset not found after finalize");
      results.push({
        assetId: asset.assetId,
        riskLoad: a.riskLoad,
        riskScore: a.riskScore,
        lastAssessedAt: a.lastAssessedAt ?? Date.now(),
      });
    }
    return results;
  },
});

/**
 * Dev/seed only: run the same assessment AI pipeline as createWithAI but with
 * synthetic user and no auth. Used by seed script to get real AI evaluation
 * for each asset after uploading photos.
 */
export const runAssessmentAIForSeed = action({
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
    const assessmentId = await ctx.runMutation(
      im.createPlaceholder as Parameters<typeof ctx.runMutation>[0],
      {
        assetId: args.assetId,
        intent: args.intent,
        createdByRole: "maintainer",
        createdByUserId: "synthetic-seed",
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
