"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/work-items", label: "Work Items" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-card-border bg-card p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-foreground">Venturai</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-foreground/70 hover:bg-card-border/50 hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
