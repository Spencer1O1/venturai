import { v } from "convex/values";

import { aiAnalysisValidator } from "../lib/ai_analysis_validator";

/** Validator for assessment documents (used by queries return types). */
export const assessmentDocValidator = v.object({
  _id: v.id("assessments"),
  _creationTime: v.number(),
  assetId: v.id("assets"),
  intent: v.union(v.literal("routine"), v.literal("problem")),
  createdByRole: v.optional(
    v.union(v.literal("admin"), v.literal("maintainer")),
  ),
  createdByUserId: v.optional(v.string()),
  photoStorageIds: v.array(v.id("_storage")),
  photoDescriptions: v.array(v.string()),
  answers: v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  notes: v.optional(v.string()),
  aiAnalysis: v.optional(aiAnalysisValidator),
  createdAt: v.number(),
});
