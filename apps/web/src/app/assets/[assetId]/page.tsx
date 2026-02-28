import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";
import { MOCK_ASSETS, MOCK_WORK_ITEMS } from "@/lib/mockData";

type Props = { params: Promise<{ assetId: string }> };

export default async function AssetDetailPage({ params }: Props) {
  const { assetId } = await params;
  const asset = MOCK_ASSETS.find((a) => a.id === assetId);
  const workItems = MOCK_WORK_ITEMS.filter(
    (w) => w.assetId === assetId && w.status === "open",
  );

  if (!asset) {
    return (
      <div className="p-8">
        <p className="text-foreground/70">Asset not found.</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold text-foreground">{asset.name}</h1>
          <p className="mt-1 text-foreground/60">{asset.location ?? "No location"}</p>
        </div>
        <RiskBadge riskScore={asset.riskScore} />
      </header>

      <section className="mb-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Risk summary
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-foreground/50">Risk score</dt>
            <dd className="mt-0.5 font-medium text-foreground">{asset.riskScore}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Risk load</dt>
            <dd className="mt-0.5 font-medium text-foreground">{asset.riskLoad}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Open work items</dt>
            <dd className="mt-0.5 font-medium text-foreground">{asset.openWorkItemCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground/50">Asset ID</dt>
            <dd className="mt-0.5 font-mono text-sm text-foreground/80">{asset.id}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Open work items
        </h2>
        {workItems.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-card p-6 text-foreground/60">
            No open work items for this asset.
          </p>
        ) : (
          <ul className="space-y-3">
            {workItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-card-border bg-card p-4"
              >
                <span className="font-medium text-foreground">{item.title}</span>
                <RiskBadge riskScore={item.riskValue} />
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
