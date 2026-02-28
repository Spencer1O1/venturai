import Link from "next/link";
import { RiskBadge } from "@/components/RiskBadge";
import { MOCK_WORK_ITEMS } from "@/lib/mockData";

export default function WorkItemsPage() {
  const openItems = MOCK_WORK_ITEMS.filter((w) => w.status === "open");

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Work Items</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Open items from inspections. Close when maintenance is complete.
        </p>
      </header>

      <div className="space-y-4">
        {openItems.length === 0 ? (
          <div className="rounded-xl border border-card-border bg-card p-8 text-center text-foreground/60">
            No open work items.
          </div>
        ) : (
          openItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-card-border"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-foreground/60">
                  <Link
                    href={`/assets/${item.assetId}`}
                    className="text-primary hover:underline"
                  >
                    {item.assetName}
                  </Link>
                  {" · "}
                  {new Date(item.reportedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge riskScore={item.riskValue} />
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
