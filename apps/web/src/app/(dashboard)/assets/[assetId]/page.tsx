"use client";

import { RiskHeatmapPill } from "@/components/RiskHeatmapCell";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = params.assetId as Id<"assets">;

  const asset = useQuery(
    api.assets.queries.getById,
    assetId ? { assetId } : "skip",
  );
  const workItems = useQuery(
    api.work_items.listOpenByAsset,
    assetId ? { assetId } : "skip",
  );
  const assessments = useQuery(
    api.assessments.queries.listByAsset,
    assetId ? { assetId } : "skip",
  );

  const latestPhotoStorageId =
    assessments && assessments.length > 0 && assessments[0].photoStorageIds.length > 0
      ? assessments[0].photoStorageIds[0]
      : null;

  const photoUrl = useQuery(
    api.storage.getUrl,
    latestPhotoStorageId ? { storageId: latestPhotoStorageId } : "skip",
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

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Most recent picture */}
        {photoUrl ? (
          <div className="shrink-0 overflow-hidden rounded-xl border border-card-border bg-card">
            <div className="relative aspect-video w-full min-w-[280px] max-w-md lg:max-w-sm">
              <Image
                src={photoUrl}
                alt={`Latest inspection of ${asset.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 384px"
                unoptimized
              />
            </div>
            <p className="border-t border-card-border px-4 py-2 text-xs text-foreground/60">
              Most recent inspection
              {assessments?.[0]?.createdAt
                ? ` · ${new Date(assessments[0].createdAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        ) : (
          <div className="flex aspect-video w-full min-w-[280px] max-w-md items-center justify-center rounded-xl border border-card-border bg-card lg:max-w-sm">
            <p className="text-sm text-foreground/50">No inspection photos yet</p>
          </div>
        )}

        {/* Asset info and risk */}
        <div className="min-w-0 flex-1">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {asset.name}
              </h1>
              {asset.locationText && (
                <p className="mt-1 text-foreground/60">{asset.locationText}</p>
              )}
            </div>
            <RiskHeatmapPill riskScore={asset.riskScore} />
          </header>

          <section className="rounded-xl border border-card-border bg-card p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
              Asset information
            </h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {asset.manufacturer && (
                <div>
                  <dt className="text-xs text-foreground/50">Manufacturer</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {asset.manufacturer}
                  </dd>
                </div>
              )}
              {asset.model && (
                <div>
                  <dt className="text-xs text-foreground/50">Model</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {asset.model}
                  </dd>
                </div>
              )}
              {asset.serial && (
                <div>
                  <dt className="text-xs text-foreground/50">Serial</dt>
                  <dd className="mt-0.5 font-mono text-sm text-foreground">
                    {asset.serial}
                  </dd>
                </div>
              )}
              {asset.locationText && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-foreground/50">Location</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {asset.locationText}
                  </dd>
                </div>
              )}
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
        </div>
      </div>

      {/* Work items */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Work items
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
