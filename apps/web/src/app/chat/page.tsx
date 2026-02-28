export default function ChatPage() {
  return (
    <div className="flex h-full flex-col p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">AI Chat</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Ask about assets, risk, or inspections. Will be connected to the AI layer
          later.
        </p>
      </header>

      <div className="flex flex-1 flex-col rounded-xl border border-card-border bg-card">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full border border-primary/30 bg-primary/10 p-4">
            <svg
              className="size-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="max-w-sm text-foreground/70">
            AI chat will be hooked up here. You’ll be able to ask questions about
            assets, risk trends, and recommended actions.
          </p>
          <p className="text-xs text-foreground/50">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
