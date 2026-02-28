import { v } from "convex/values";

import { query } from "./_generated/server";

const assessmentDocValidator = v.object({
  _id: v.id("assessments"),
  _creationTime: v.number(),
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
});

/**
 * List assessments for an asset, recent first.
 */
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  returns: v.array(assessmentDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessments")
      .withIndex("by_assetId_and_createdAt", (q) =>
        q.eq("assetId", args.assetId),
      )
      .order("desc")
      .collect();
  },
});
