"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/work-items", label: "Work Items" },
  { href: "/orgs", label: "Organizations" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
    router.refresh();
  };

  return (
    <aside className="flex w-56 flex-col border-r border-card-border bg-card p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight text-primary shadow-[0_0_12px_var(--primary)] ring-primary/30 ring-1 ring-inset">
            VENTURAI
          </span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-l-2 border-l-primary bg-primary/15 text-primary"
                  : "border-l-2 border-l-transparent text-foreground/70 hover:bg-card-border/50 hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/70 transition-all hover:bg-card-border/50 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
