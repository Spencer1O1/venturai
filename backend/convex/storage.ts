import { v } from "convex/values";

import { internalQuery, mutation, query } from "./_generated/server";

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
 * Get URL for a stored file (for displaying images in the app).
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get URLs for multiple stored files (for displaying assessment photos).
 */
export const getUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  returns: v.array(v.union(v.string(), v.null())),
  handler: async (ctx, args) => {
    const urls: (string | null)[] = [];
    for (const id of args.storageIds) {
      urls.push(await ctx.storage.getUrl(id));
    }
    return urls;
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
