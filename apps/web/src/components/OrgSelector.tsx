"use client";

import type { Id } from "@venturai/backend/dataModel";
import { useSelectedOrg } from "@/hooks/useSelectedOrg";

export function OrgSelector() {
  const { orgId, orgs, setOrgId } = useSelectedOrg();

  if (!orgs || orgs.length <= 1) return null;

  return (
    <div className="mb-4">
      <label
        htmlFor="org-select"
        className="mb-1 block text-xs font-medium text-foreground/60"
      >
        Organization
      </label>
      <select
        id="org-select"
        value={orgId ?? ""}
        onChange={(e) => setOrgId(e.target.value as Id<"orgs">)}
        className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {orgs.map((org) => (
          <option key={org._id} value={org._id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
