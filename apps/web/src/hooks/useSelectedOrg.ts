"use client";

import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Returns the currently selected org for dashboard/asset views.
 * Selection is persisted via ?org= URL param, or inferred from /orgs/[orgId] path.
 */
export function useSelectedOrg() {
  const orgs = useQuery(api.org_members.getOrgsUserBelongsTo);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const orgParam = searchParams.get("org");
  const orgFromPath = pathname.startsWith("/orgs/")
    ? (pathname.replace("/orgs/", "").split("/")[0] as Id<"orgs"> | undefined)
    : undefined;
  const orgId: Id<"orgs"> | undefined =
    (orgParam && orgs?.some((o) => o._id === orgParam)
      ? orgParam
      : orgFromPath && orgs?.some((o) => o._id === orgFromPath)
        ? orgFromPath
        : orgs?.[0]?._id) as Id<"orgs"> | undefined;

  const setOrgId = (id: Id<"orgs">) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("org", id);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return { orgId, orgs, setOrgId };
}
