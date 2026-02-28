import { v } from "convex/values";

import { query } from "../_generated/server";
import { assessmentDocValidator } from "./helpers";

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
