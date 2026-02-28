"use client";

import { RiskHeatmapPill } from "@/components/RiskHeatmapCell";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function WorkItemsPage() {
  const orgs = useQuery(api.org_members.getOrgsUserBelongsTo);
  const orgId = orgs?.[0]?._id;
  const openWorkItems = useQuery(
    api.work_items.listOpenByOrgOrGroup,
    orgId ? { orgId } : "skip",
  );
  const assets = useQuery(
    api.assets.queries.listByOrg,
    orgId ? { orgId } : "skip",
  );

  const assetNameById = new Map<Id<"assets">, string>();
  for (const a of assets ?? []) {
    assetNameById.set(a._id, a.name);
  }

  if (orgs === undefined || openWorkItems === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-center text-foreground/70">
          Create an organization to view work items.
        </p>
        <Link href="/orgs" className="text-primary hover:underline">
          Go to Organizations →
        </Link>
      </div>
    );
  }

  const items = openWorkItems ?? [];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Work Items
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Open items from inspections. Close when maintenance is complete.
        </p>
      </header>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card p-8 text-center text-foreground/60">
            No open work items.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-card-border"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-foreground/60">
                  <Link
                    href={`/assets/${item.assetId}`}
                    className="text-primary hover:underline"
                  >
                    {assetNameById.get(item.assetId) ?? "Unknown asset"}
                  </Link>
                  {" · "}
                  {new Date(item.firstSeenAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RiskHeatmapPill riskScore={item.riskValue} />
                <span className="rounded-md border border-card-border bg-background px-3 py-1 text-xs text-foreground/70">
                  Open
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
