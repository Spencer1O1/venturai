"use client";

export function DataQueryPanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col rounded-xl border border-card-border bg-card p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-foreground/80">
        Query your data
      </h2>
      <p className="mb-4 text-xs text-foreground/60">
        Filter or sort in plain English. AI will translate to queries.
      </p>
      <textarea
        className="min-h-[6rem] w-full resize-y rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="e.g. Show assets with risk above 70, sort by location, only Building 1"
        rows={3}
      />
      <button
        type="button"
        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        Run query
      </button>
      <p className="mt-3 text-xs text-foreground/50">
        Will be connected to the AI layer. For now, use the table sort/filter.
      </p>
    </aside>
  );
}
