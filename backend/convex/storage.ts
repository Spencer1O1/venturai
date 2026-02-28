import { v } from "convex/values";

import { internalQuery, mutation } from "./_generated/server";

/**
 * Generate an upload URL for storing photos (e.g. assessment images).
 * Client uploads the file to this URL, then passes the returned storage ID.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Internal: resolve storage IDs to URLs for AI vision.
 * Used by assessments:createWithAI action.
 */
export const getImageUrls = internalQuery({
  args: { storageIds: v.array(v.id("_storage")) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const urls: string[] = [];
    for (const id of args.storageIds) {
      const url = await ctx.storage.getUrl(id);
      if (url) urls.push(url);
    }
    return urls;
  },
});
