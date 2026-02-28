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
 * Create an assessment template.
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
    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

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
