"use client";

import { RiskHeatmapPill } from "@/components/RiskHeatmapCell";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.assetId as string;

  const asset = useQuery(
    api.assets.queries.getById,
    assetId ? { assetId: assetId as Id<"assets"> } : "skip",
  );
  const workItems = useQuery(
    api.work_items.listOpenByAsset,
    assetId ? { assetId: assetId as Id<"assets"> } : "skip",
  );

  if (asset === undefined || workItems === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8">
        <p className="text-foreground/70">Asset not found.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const openItems = workItems ?? [];

  return (
    <div className="p-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-foreground/70 hover:text-primary"
      >
        ← Back to dashboard
      </Link>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {asset.name}
          </h1>
          <p className="mt-1 text-foreground/60">
            {asset.locationText ?? "No location"}
          </p>
        </div>
        <RiskHeatmapPill riskScore={asset.riskScore} />
      </header>

      <section className="mb-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Risk summary
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-foreground/50">Risk score</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {asset.riskScore}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Risk load</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {asset.riskLoad}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Open work items</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {openItems.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Asset ID</dt>
            <dd className="mt-0.5 font-mono text-sm text-foreground/80">
              {asset._id}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Open work items
        </h2>
        {openItems.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-card p-6 text-foreground/60">
            No open work items for this asset.
          </p>
        ) : (
          <ul className="space-y-3">
            {openItems.map((item) => (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-card-border bg-card p-4"
              >
                <span className="font-medium text-foreground">
                  {item.title}
                </span>
                <RiskHeatmapPill riskScore={item.riskValue} />
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/work-items"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          View all work items →
        </Link>
      </section>
    </div>
  );
}
