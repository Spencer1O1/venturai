"use client";

import { DataQueryPanel } from "@/components/DataQueryPanel";
import { RiskHeatmapCell } from "@/components/RiskHeatmapCell";
import { useSelectedOrg } from "@/hooks/useSelectedOrg";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function DashboardPage() {
  const { orgId, orgs } = useSelectedOrg();
  const assets = useQuery(
    api.assets.queries.listByOrg,
    orgId ? { orgId } : "skip",
  );
  const openWorkItems = useQuery(
    api.work_items.listOpenByOrgOrGroup,
    orgId ? { orgId } : "skip",
  );

  const openCountByAsset = new Map<Id<"assets">, number>();
  for (const wi of openWorkItems ?? []) {
    openCountByAsset.set(wi.assetId, (openCountByAsset.get(wi.assetId) ?? 0) + 1);
  }

  if (orgs === undefined) {
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
          Create an organization to view assets.
        </p>
        <Link
          href="/orgs"
          className="text-primary hover:underline"
        >
          Go to Organizations →
        </Link>
      </div>
    );
  }

  if (orgId && assets === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 lg:flex-row">
      <div className="order-2 min-w-0 flex-1 lg:order-1">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Assets
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Sorted by risk. Tap an asset to view details or open work items.
          </p>
        </header>

        <div className="overflow-hidden rounded-xl border border-card-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card/80">
                <th className="px-6 py-4 font-medium text-foreground/80">
                  Asset
                </th>
                <th className="px-6 py-4 font-medium text-foreground/80">
                  Location
                </th>
                <th className="px-6 py-4 font-medium text-foreground/80">
                  Risk
                </th>
                <th className="px-6 py-4 font-medium text-foreground/80">
                  Open items
                </th>
                <th className="px-6 py-4 font-medium text-foreground/80" />
              </tr>
            </thead>
            <tbody>
              {(assets ?? []).map((asset) => (
                <tr
                  key={asset._id}
                  className="border-b border-card-border/50 transition-colors hover:bg-card-border/20"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/assets/${asset._id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {asset.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-foreground/70">
                    {asset.locationText ?? "—"}
                  </td>
                  <RiskHeatmapCell riskScore={asset.riskScore} />
                  <td className="px-6 py-4 text-foreground/70">
                    {openCountByAsset.get(asset._id) ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/work-items?asset=${asset._id}`}
                      className="text-primary hover:underline"
                    >
                      View work items →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {assets?.length === 0 && (
          <p className="mt-4 text-center text-foreground/60">
            No assets yet. Add assets from your organization.
          </p>
        )}
      </div>

      <div className="order-1 shrink-0 lg:order-2">
        <DataQueryPanel />
      </div>
    </div>
  );
}
