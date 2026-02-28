"use client";

import { useSelectedOrg } from "@/hooks/useSelectedOrg";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { OrgSelector } from "./OrgSelector";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/assets", label: "Assets" },
  { href: "/work-items", label: "Work Items" },
  { href: "/orgs", label: "Organizations" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { orgId } = useSelectedOrg();
  const { signOut } = useAuthActions();

  const appendOrg = (href: string) => {
    if (!orgId || href.startsWith("/orgs")) return href;
    return `${href}${href.includes("?") ? "&" : "?"}org=${orgId}`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
    router.refresh();
  };

  return (
    <aside className="flex w-56 flex-col border-r border-card-border bg-card p-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href={appendOrg("/")} className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-foreground">Venturai</span>
        </Link>
        <ThemeToggle />
      </div>
      <OrgSelector />
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={appendOrg(href)}
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
        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground/70 hover:bg-card-border/50 hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </nav>
    </aside>
  );
}
