"use client";

import { RiskHeatmapPill } from "@/components/RiskHeatmapCell";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WorkItemDetailPage() {
  const params = useParams();
  const workItemId = params.workItemId as Id<"workItems">;

  const workItem = useQuery(
    api.work_items.getById,
    workItemId ? { workItemId } : "skip",
  );
  const asset = useQuery(
    api.assets.queries.getById,
    workItem?.assetId ? { assetId: workItem.assetId } : "skip",
  );

  if (workItem === undefined) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!workItem) {
    return (
      <div className="p-8">
        <p className="text-foreground/70">Work item not found.</p>
        <Link
          href="/work-items"
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to work items
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/work-items"
        className="mb-6 inline-block text-sm text-foreground/70 hover:text-primary"
      >
        ← Back to work items
      </Link>

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {workItem.title}
              </h1>
              <p className="mt-1 text-foreground/60">
                {workItem.status === "open" ? "Open" : "Closed"} work item
              </p>
            </div>
            <RiskHeatmapPill riskScore={workItem.riskValue} />
          </header>

          <section className="rounded-xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-foreground/50">Asset</dt>
                <dd className="mt-0.5">
                  {asset ? (
                    <Link
                      href={`/assets/${workItem.assetId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {asset.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">
                      {workItem.assetId}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Status</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {workItem.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Risk</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {workItem.riskValue}/100
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">First seen</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {new Date(workItem.firstSeenAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Last seen</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {new Date(workItem.lastSeenAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/50">Evidence count</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {workItem.evidenceCount}
                </dd>
              </div>
              {workItem.closedAt && (
                <>
                  <div>
                    <dt className="text-xs text-foreground/50">Closed</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {new Date(workItem.closedAt).toLocaleDateString()}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <div className="mt-6 flex gap-3">
            <Link
              href={`/assets/${workItem.assetId}`}
              className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              View asset →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
