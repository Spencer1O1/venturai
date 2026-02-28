import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

const additionalQuestionValidator = v.object({
  key: v.string(),
  label: v.string(),
  type: v.union(v.literal("text"), v.literal("number"), v.literal("boolean")),
});

/**
 * Get a template by ID.
 */
export const getById = query({
  args: { templateId: v.id("assessmentTemplates") },
  returns: v.union(
    v.object({
      _id: v.id("assessmentTemplates"),
      _creationTime: v.number(),
      orgId: v.id("orgs"),
      name: v.string(),
      photoDescriptions: v.array(v.string()),
      additionalQuestions: v.array(additionalQuestionValidator),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

/**
 * Create an assessment template. Caller must be admin of the org.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    photoDescriptions: v.array(v.string()),
    additionalQuestions: v.array(additionalQuestionValidator),
  },
  returns: v.id("assessmentTemplates"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    if (
      membership?.role !== "admin" &&
      membership?.role !== "owner"
    )
      throw new Error("Must be admin or owner of this org");

    const now = Date.now();
    return await ctx.db.insert("assessmentTemplates", {
      orgId: args.orgId,
      name: args.name,
      photoDescriptions: args.photoDescriptions,
      additionalQuestions: args.additionalQuestions,
      createdAt: now,
    });
  },
});

/**
 * Update an assessment template. Caller must be admin of the org.
 */
export const update = mutation({
  args: {
    templateId: v.id("assessmentTemplates"),
    name: v.optional(v.string()),
    photoDescriptions: v.optional(v.array(v.string())),
    additionalQuestions: v.optional(v.array(additionalQuestionValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", template.orgId),
      )
      .unique();

    if (
      membership?.role !== "admin" &&
      membership?.role !== "owner"
    )
      throw new Error("Must be admin or owner of this org");

    const updates: {
      name?: string;
      photoDescriptions?: string[];
      additionalQuestions?: Array<{
        key: string;
        label: string;
        type: "text" | "number" | "boolean";
      }>;
    } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.photoDescriptions !== undefined)
      updates.photoDescriptions = args.photoDescriptions;
    if (args.additionalQuestions !== undefined)
      updates.additionalQuestions = args.additionalQuestions;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.templateId, updates);
    }
    return null;
  },
});
