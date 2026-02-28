"use client";

import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const orgs = useQuery(api.org_members.getOrgsUserBelongsTo);
  const groups = useQuery(
    api.maintenance_groups.listByOrg,
    orgId ? { orgId: orgId as Id<"orgs"> } : "skip",
  );
  const members = useQuery(
    api.org_members.listByOrg,
    orgId ? { orgId: orgId as Id<"orgs"> } : "skip",
  );
  const createGroup = useMutation(api.maintenance_groups.create);
  const createInvite = useMutation(api.org_invites.create);
  const addMaintainer = useMutation(api.users.addMaintenanceGroupMember);
  const removeMaintainer = useMutation(api.maintenance_groups.removeMaintainer);
  const removeOrgMember = useMutation(api.org_members.removeOrgMember);

  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteCreating, setInviteCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingMaintainer, setAddingMaintainer] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const orgEntry = orgs?.find((o) => o._id === orgId);
  const org = orgEntry ? { _id: orgEntry._id, name: orgEntry.name } : null;
  const isAdmin =
    orgEntry?.role === "admin" || orgEntry?.role === "owner";

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !orgId) return;
    setError(null);
    setCreating(true);
    try {
      await createGroup({
        orgId: orgId as Id<"orgs">,
        name: groupName.trim(),
      });
      setGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInvite = async (role: "admin" | "member") => {
    if (!orgId) return;
    setError(null);
    setInviteCreating(true);
    setInviteUrl(null);
    try {
      const { url } = await createInvite({
        orgId: orgId as Id<"orgs">,
        role,
      });
      setInviteUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setInviteCreating(false);
    }
  };

  const handleAddMaintainer = async (
    groupId: Id<"maintenanceGroups">,
    userId: Id<"users">,
  ) => {
    setAddingMaintainer(groupId);
    setError(null);
    try {
      await addMaintainer({ maintenanceGroupId: groupId, userId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add maintainer");
    } finally {
      setAddingMaintainer(null);
    }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (!orgId) return;
    setRemovingMember(userId);
    setError(null);
    try {
      await removeOrgMember({ orgId: orgId as Id<"orgs">, userId });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setRemovingMember(null);
    }
  };

  const handleRemoveMaintainer = async (
    groupId: Id<"maintenanceGroups">,
    userId: Id<"users">,
  ) => {
    setError(null);
    try {
      await removeMaintainer({
        maintenanceGroupId: groupId,
        userId,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove maintainer",
      );
    }
  };

  if (
    orgs === undefined ||
    (orgId && groups === undefined) ||
    (orgId && members === undefined)
  ) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8">
        <div className="text-foreground/60">Loading…</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-8">
        <p className="text-foreground/70">
          Organization not found or you don&apos;t have access.
        </p>
        <Link
          href="/orgs"
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to organizations
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/orgs"
        className="mb-6 inline-block text-sm text-foreground/70 hover:text-primary"
      >
        ← Back to organizations
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{org.name}</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Maintenance groups, members, and templates.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Maintenance groups
        </h2>
        <p className="mb-4 text-sm text-foreground/70">
          Create groups (e.g. &quot;Pump Bay A&quot;) to organize assets and
          assign maintainers.
        </p>
        {isAdmin && (
          <form
            onSubmit={handleCreateGroup}
            className="mb-6 flex flex-wrap gap-3"
          >
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={creating || !groupName.trim()}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Add group"}
            </button>
          </form>
        )}
        {groups && groups.length > 0 ? (
          <ul className="space-y-4">
            {groups.map((g) => (
              <GroupRow
                key={g._id}
                group={g}
                orgMembers={members ?? []}
                isAdmin={isAdmin}
                onAddMaintainer={handleAddMaintainer}
                onRemoveMaintainer={handleRemoveMaintainer}
                addingMaintainer={addingMaintainer}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">
            No maintenance groups yet.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-card-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-foreground/60">
          Member management
        </h2>
        {isAdmin && (
          <div className="mb-6">
            <p className="mb-3 text-sm text-foreground/70">
              Create a shareable link to invite people to join this
              organization.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCreateInvite("member")}
                disabled={inviteCreating}
                className="rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background/80 disabled:opacity-50"
              >
                {inviteCreating ? "Creating…" : "Invite as member"}
              </button>
              <button
                type="button"
                onClick={() => handleCreateInvite("admin")}
                disabled={inviteCreating}
                className="rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background/80 disabled:opacity-50"
              >
                {inviteCreating ? "Creating…" : "Invite as admin"}
              </button>
            </div>
            {inviteUrl && (
              <div className="mt-3 rounded-lg border border-card-border bg-background/50 p-3">
                <p className="mb-2 text-xs text-foreground/60">
                  Link copied to clipboard (expires in 7 days):
                </p>
                <code className="break-all text-sm text-foreground">
                  {inviteUrl}
                </code>
              </div>
            )}
          </div>
        )}
        {members && members.length > 0 ? (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m._id}
                className="flex items-center justify-between rounded-lg border border-card-border/50 bg-background/50 px-4 py-2"
              >
                <span className="font-medium text-foreground">
                  {m.name || m.email || "Unknown"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground/60 capitalize">
                    {m.role}
                  </span>
                  {isAdmin &&
                    m.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        disabled={removingMember === m.userId}
                        className="text-sm text-foreground/60 hover:text-red-500 disabled:opacity-50"
                        title="Remove from organization"
                      >
                        {removingMember === m.userId ? "Removing…" : "Remove"}
                      </button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">No members yet.</p>
        )}
      </section>
    </div>
  );
}

function GroupRow({
  group,
  orgMembers,
  isAdmin,
  onAddMaintainer,
  onRemoveMaintainer,
  addingMaintainer,
}: {
  group: {
    _id: Id<"maintenanceGroups">;
    name: string;
  };
  orgMembers: Array<{
    _id: Id<"orgMembers">;
    userId: Id<"users">;
    role: string;
    email?: string;
    name?: string;
  }>;
  isAdmin: boolean;
  onAddMaintainer: (
    groupId: Id<"maintenanceGroups">,
    userId: Id<"users">,
  ) => void;
  onRemoveMaintainer: (
    groupId: Id<"maintenanceGroups">,
    userId: Id<"users">,
  ) => void;
  addingMaintainer: string | null;
}) {
  const maintainers = useQuery(
    api.maintenance_groups.listMaintainers,
    { maintenanceGroupId: group._id },
  );
  const maintainerIds = new Set(
    (maintainers ?? []).map((m) => m.userId),
  );
  const availableToAdd = orgMembers.filter((m) => !maintainerIds.has(m.userId));

  return (
    <li className="rounded-lg border border-card-border/50 bg-background/50 p-4">
      <div className="mb-2 font-medium text-foreground">{group.name}</div>
      <div className="space-y-2 text-sm">
        {maintainers && maintainers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {maintainers.map((m) => (
              <span
                key={m._id}
                className="inline-flex items-center gap-1 rounded bg-primary/20 px-2 py-0.5"
              >
                {m.name || m.email || "Unknown"}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onRemoveMaintainer(group._id, m.userId)}
                    className="ml-1 text-foreground/60 hover:text-red-500"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {isAdmin && availableToAdd.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableToAdd.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => onAddMaintainer(group._id, m.userId)}
                disabled={addingMaintainer === group._id}
                className="rounded border border-card-border px-2 py-0.5 text-foreground/70 hover:bg-background disabled:opacity-50"
              >
                + {m.name || m.email || "Unknown"}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
