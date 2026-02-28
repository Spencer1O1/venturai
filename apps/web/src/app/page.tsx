import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";
import { MOCK_ASSETS } from "@/lib/mockData";

export default function DashboardPage() {
  const assets = [...MOCK_ASSETS].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Assets</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Sorted by risk. Tap an asset to view details or open work items.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border bg-card/80">
              <th className="px-6 py-4 font-medium text-foreground/80">Asset</th>
              <th className="px-6 py-4 font-medium text-foreground/80">Location</th>
              <th className="px-6 py-4 font-medium text-foreground/80">Risk</th>
              <th className="px-6 py-4 font-medium text-foreground/80">Open items</th>
              <th className="px-6 py-4 font-medium text-foreground/80" />
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className="border-b border-card-border/50 transition-colors hover:bg-card-border/20"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-foreground/70">{asset.location ?? "—"}</td>
                <td className="px-6 py-4">
                  <RiskBadge riskScore={asset.riskScore} />
                </td>
                <td className="px-6 py-4 text-foreground/70">{asset.openWorkItemCount}</td>
                <td className="px-6 py-4">
                  <Link
                    href={`/work-items?asset=${asset.id}`}
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
    </div>
  );
}
