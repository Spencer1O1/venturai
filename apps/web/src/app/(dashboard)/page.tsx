"use client";

import { RiskHeatmapPill } from "@/components/RiskHeatmapCell";
import { useSelectedOrg } from "@/hooks/useSelectedOrg";
import { getRiskTier } from "@/lib/risk";
import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import Link from "next/link";

function ScanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

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

  const assetNameById = new Map<Id<"assets">, string>();
  for (const a of assets ?? []) {
    assetNameById.set(a._id, a.name);
  }

  const highRiskItems = (openWorkItems ?? []).slice(0, 5);
  const totalAssets = assets?.length ?? 0;
  const issuesFound = openWorkItems?.length ?? 0;
  const issuesRate = totalAssets > 0 ? Math.round((issuesFound / totalAssets) * 100) : 0;
  const highRiskCount = assets?.filter((a) => a.riskScore > 75).length ?? 0;
  const avgRiskScoreNum = totalAssets > 0
    ? (assets ?? []).reduce((s, a) => s + a.riskScore, 0) / totalAssets
    : 0;
  const avgRiskScore = avgRiskScoreNum.toFixed(1);

  const riskDistribution = (assets ?? []).reduce(
    (acc, a) => {
      const tier = getRiskTier(a.riskScore);
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const noIssuesCount = riskDistribution.low ?? 0;
  const lowCount = riskDistribution.low ?? 0;
  const mediumCount = riskDistribution.medium ?? 0;
  const highCount = riskDistribution.high ?? 0;
  const criticalCount = riskDistribution.critical ?? 0;

  const pieSegments = [
    { label: "No Issues", value: noIssuesCount, color: "#6E7681", pct: totalAssets ? (noIssuesCount / totalAssets) * 100 : 93 },
    { label: "Medium", value: mediumCount, color: "#FBBF24", pct: totalAssets ? (mediumCount / totalAssets) * 100 : 0 },
    { label: "High Risk", value: highCount + criticalCount, color: "#F87171", pct: totalAssets ? ((highCount + criticalCount) / totalAssets) * 100 : 0 },
  ].filter((s) => s.value > 0);

  const operationalCount = lowCount;
  const maintenanceCount = mediumCount;
  const criticalStatusCount = highCount + criticalCount;
  const offlineCount = 0;

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
        <Link href="/orgs" className="text-primary hover:underline">
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
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Total Assets</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalAssets}</p>
          {totalAssets > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-risk-low">
              <span aria-hidden>▲</span> +{totalAssets}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Issues Found</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{issuesFound}</p>
          <p className="mt-0.5 text-sm text-foreground/60">{issuesRate}% rate</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">High Risk</p>
          <p className="mt-1 text-2xl font-bold text-risk-critical">{highRiskCount}</p>
          <p className="mt-0.5 text-sm text-risk-critical">Requires Action</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Open Actions</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{issuesFound}</p>
          <p className="mt-0.5 text-sm text-risk-high">Pending</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Completed</p>
          <p className="mt-1 text-2xl font-bold text-foreground">—</p>
          <p className="mt-0.5 text-sm text-foreground/60">Last 24h</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">Avg Risk Score</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {avgRiskScore}
          </p>
          <div className="relative mt-3 h-8 w-full">
            <span
              className="absolute bottom-2 left-0 text-sm leading-none"
              style={{
                color: "var(--foreground)",
                transform: "translateX(-50%)",
                left: `${Math.min(Math.max(avgRiskScoreNum, 0), 100)}%`,
              }}
              aria-hidden
            >
              ▼
            </span>
            <div
              className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden rounded-full"
              style={{
                background: "linear-gradient(90deg, #00D68F, #FBBF24, #f97316, #F87171)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* High Risk Actions */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-risk-critical" aria-hidden>▲</span>
                <h2 className="font-semibold text-foreground">High Risk Actions</h2>
                {highRiskCount > 0 && (
                  <span className="rounded-full bg-risk-critical/20 px-2 py-0.5 text-xs font-medium text-risk-critical">
                    Critical Attention Needed
                  </span>
                )}
              </div>
              <Link href="/work-items" className="text-sm text-primary hover:underline">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border text-foreground/60">
                    <th className="pb-3 pr-4 font-medium">Score</th>
                    <th className="pb-3 pr-4 font-medium">Issue</th>
                    <th className="pb-3 pr-4 font-medium">Asset</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {highRiskItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-foreground/60">
                        No high-risk actions
                      </td>
                    </tr>
                  ) : (
                    highRiskItems.map((item) => (
                      <tr key={item._id} className="border-b border-card-border/50 last:border-0">
                        <td className="py-3 pr-4">
                          <RiskHeatmapPill riskScore={item.riskValue} />
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-medium text-foreground">{item.title}</span>
                          <p className="text-xs text-foreground/60">
                            {new Date(item.firstSeenAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/assets/${item.assetId}`}
                            className="text-foreground/70 hover:text-primary hover:underline"
                          >
                            {assetNameById.get(item.assetId) ?? "—"}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="rounded-md bg-risk-critical/20 px-2 py-0.5 text-xs text-risk-critical">
                            Unacknowledged
                          </span>
                        </td>
                        <td className="py-3">
                          <button type="button" className="p-1 text-foreground/60 hover:text-foreground" aria-label="Actions">
                            ⋮
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <RefreshIcon />
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
            </div>
            <ul className="space-y-3">
              {highRiskItems.slice(0, 3).map((item) => (
                <li key={item._id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-low" aria-hidden />
                  <div>
                    <p className="text-sm text-foreground">
                      {item.title}{" "}
                      on{" "}
                      <Link
                        href={`/assets/${item.assetId}`}
                        className="text-primary hover:underline"
                      >
                        {assetNameById.get(item.assetId) ?? "asset"}
                      </Link>
                    </p>
                    <p className="text-xs text-foreground/60">
                      {new Date(item.firstSeenAt).toLocaleDateString()} • Detected
                    </p>
                  </div>
                </li>
              ))}
              {highRiskItems.length === 0 && (
                <li className="text-sm text-foreground/60">No recent activity</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Risk Distribution */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Risk Distribution</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  {pieSegments.length === 0 ? (
                    <circle cx="18" cy="18" r="16" fill="#64748b" opacity="0.3" />
                  ) : (
                    pieSegments.map((seg, i) => {
                      const offset = pieSegments
                        .slice(0, i)
                        .reduce((s, p) => s + (p.pct / 100) * 100, 0);
                      const dash = `${seg.pct} ${100 - seg.pct}`;
                      return (
                        <circle
                          key={seg.label}
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="4"
                          strokeDasharray={dash}
                          strokeDashoffset={-offset}
                        />
                      );
                    })
                  )}
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                {pieSegments.map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-foreground/80">{s.label}</span>
                    <span className="text-foreground/60">{s.pct.toFixed(1)}%</span>
                  </div>
                ))}
                {pieSegments.length === 0 && (
                  <p className="text-foreground/60">No data</p>
                )}
              </div>
            </div>
          </div>

          {/* Asset Status */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Asset Status</h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-risk-low" />
                  Operational
                </span>
                <span className="font-medium text-foreground">{operationalCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-risk-high" />
                  Maintenance
                </span>
                <span className="font-medium text-foreground">{maintenanceCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-risk-critical" />
                  Critical
                </span>
                <span className="font-medium text-foreground">{criticalStatusCount}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground/30" />
                  Offline
                </span>
                <span className="font-medium text-foreground">{offlineCount}</span>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="mb-4 font-semibold text-foreground">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/assets"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90"
              >
                <ScanIcon />
                Start New Scan
              </Link>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <ReportIcon />
                Export Report
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <CalendarIcon />
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
