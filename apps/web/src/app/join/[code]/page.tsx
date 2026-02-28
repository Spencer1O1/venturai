"use client";

import { api } from "@venturai/backend";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinOrgPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();

  const invite = useQuery(
    api.org_invites.getByCode,
    code ? { code } : "skip",
  );
  const acceptInvite = useMutation(api.org_invites.accept);

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!code) return;
    setError(null);
    setAccepting(true);
    try {
      const orgId = await acceptInvite({ code });
      router.push(`/orgs/${orgId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setAccepting(false);
    }
  };

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-foreground/70">Invalid invite link.</p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (invite === undefined || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-foreground/70">
            This invite link is invalid or has expired.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Join {invite.orgName}
            </h1>
            <p className="mt-2 text-sm text-foreground/60">
              Sign in or create an account to join this organization.
            </p>
          </div>
          <Link
            href={`/signin?redirect=${encodeURIComponent(`/join/${code}`)}`}
            className="inline-block w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in to join
          </Link>
          <p className="text-sm text-foreground/60">
            <Link href="/" className="text-primary hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Join {invite.orgName}
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            You&apos;ll be added as {invite.role === "admin" ? "an admin" : "a member"}.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {accepting ? "Joining…" : "Accept invite"}
        </button>

        <p className="text-sm text-foreground/60">
          <Link href="/orgs" className="text-primary hover:underline">
            ← Back to organizations
          </Link>
        </p>
      </div>
    </div>
  );
}
