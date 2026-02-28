"use client";

import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const orgs = useQuery(api.org_members.getOrgsUserIsAdminOf);
  const groups = useQuery(
    api.maintenance_groups.listByOrg,
    orgId ? { orgId: orgId as Id<"orgs"> } : "skip",
  );
  const createGroup = useMutation(api.maintenance_groups.create);

  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const org = orgs?.find((o) => o._id === orgId);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !orgId) return;
    setError(null);
    setCreating(true);
    try {
      await createGroup({
        orgId: orgId as Id<"orgs">,
        name: groupName.trim(),
      });
      setGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  if (orgs === undefined || (orgId && groups === undefined)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-8">
        <p className="text-foreground/70">
          Organization not found or you don&apos;t have access.
        </p>
        <Link
          href="/orgs"
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/orgs"
        className="mb-6 inline-block text-sm text-foreground/70 hover:text-primary"
      >
        ← Back to organizations
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{org.name}</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Maintenance groups, members, and templates.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Maintenance groups
        </h2>
        <p className="mb-4 text-sm text-foreground/70">
          Create groups (e.g. &quot;Pump Bay A&quot;) to organize assets and
          assign maintainers.
        </p>
        <form
          onSubmit={handleCreateGroup}
          className="mb-6 flex flex-wrap gap-3"
        >
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={creating || !groupName.trim()}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Add group"}
          </button>
        </form>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {groups && groups.length > 0 ? (
          <ul className="space-y-2">
            {groups.map((g) => (
              <li
                key={g._id}
                className="flex items-center justify-between rounded-lg border border-card-border/50 bg-background/50 px-4 py-2"
              >
                <span className="font-medium text-foreground">{g.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">
            No maintenance groups yet.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Member management
        </h2>
        <p className="text-sm text-foreground/60">
          Coming soon: add members and assign maintainers to groups.
        </p>
      </section>
    </div>
  );
}
