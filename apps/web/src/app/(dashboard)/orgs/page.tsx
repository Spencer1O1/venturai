"use client";

import { api } from "@venturai/backend";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrgsPage() {
  const router = useRouter();
  const orgs = useQuery(api.org_members.getOrgsUserBelongsTo);
  const createOrg = useMutation(api.orgs.create);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      const orgId = await createOrg({ name: name.trim() });
      setName("");
      router.push(`/orgs/${orgId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create org");
    } finally {
      setCreating(false);
    }
  };

  if (orgs === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Organizations
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Create an organization to add maintenance groups and assets.
        </p>
      </header>

      <div className="space-y-8">
        <section className="rounded-xl border border-card-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
            Create organization
          </h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </section>

        {orgs.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
              Your organizations
            </h2>
            <ul className="space-y-3">
              {orgs.map((org) => (
                <li key={org._id}>
                  <Link
                    href={`/orgs/${org._id}`}
                    className="block rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <span className="font-medium text-foreground">
                      {org.name}
                    </span>
                    <span className="ml-2 text-sm text-foreground/60 capitalize">
                      {org.role}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
