"use client";

import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
      <p className="text-center text-foreground/60">
        Export inspection reports, maintenance summaries, and risk analytics.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Back to Dashboard →
      </Link>
    </div>
  );
}
