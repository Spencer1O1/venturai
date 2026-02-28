import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const INVITE_EXPIRY_DAYS = 7;
const CODE_LENGTH = 10;
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join(
    "",
  );
}

/**
 * Create a shareable invite link. Caller must be admin of the org.
 */
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    role: v.union(v.literal("admin"), v.literal("member")),
    maxUses: v.optional(v.number()),
  },
  returns: v.object({
    code: v.string(),
    url: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", args.orgId),
      )
      .unique();

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new Error("Must be admin of this org to create invites");
    }

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Org not found");

    let code: string;
    let existing: Doc<"orgInvites"> | null;
    do {
      code = generateCode();
      existing = await ctx.db
        .query("orgInvites")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    } while (existing);

    const expiresAt = Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const maxUses = args.maxUses ?? 1;

    await ctx.db.insert("orgInvites", {
      orgId: args.orgId,
      code,
      role: args.role,
      createdByUserId: userId,
      expiresAt,
      maxUses,
      useCount: 0,
    });

    const baseUrl = process.env.APP_URL;
    if (!baseUrl) throw new Error("APP_URL is not set");
    const url = `${baseUrl.replace(/\/$/, "")}/join/${code}`;

    return { code, url };
  },
});

/**
 * Get invite details by code. Public (no auth) so join page can show org name.
 */
export const getByCode = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      orgId: v.id("orgs"),
      orgName: v.string(),
      role: v.union(v.literal("admin"), v.literal("member")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("orgInvites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!invite) return null;
    if (invite.expiresAt < Date.now()) return null;
    if (invite.maxUses !== undefined && invite.useCount >= invite.maxUses) {
      return null;
    }

    const org = await ctx.db.get(invite.orgId);
    if (!org) return null;

    return {
      orgId: org._id,
      orgName: org.name,
      role: invite.role,
    };
  },
});

/**
 * Accept an invite. Adds the current user to the org. Must be authenticated.
 */
export const accept = mutation({
  args: { code: v.string() },
  returns: v.id("orgs"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to accept an invite");

    const invite = await ctx.db
      .query("orgInvites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.expiresAt < Date.now()) throw new Error("Invite has expired");
    if (invite.maxUses !== undefined && invite.useCount >= invite.maxUses) {
      throw new Error("Invite has reached its maximum uses");
    }

    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId_and_orgId", (q) =>
        q.eq("userId", userId).eq("orgId", invite.orgId),
      )
      .unique();

    if (existing) {
      return invite.orgId;
    }

    await ctx.db.insert("orgMembers", {
      userId,
      orgId: invite.orgId,
      role: invite.role,
    });

    await ctx.db.patch(invite._id, { useCount: invite.useCount + 1 });

    return invite.orgId;
  },
});
