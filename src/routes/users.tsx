import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { UserPlus, MoreHorizontal, Pencil, KeyRound, Archive } from "lucide-react";
import { UserModal, ResetPasswordDialog, ArchiveDialog } from "@/components/modals";
import { User, UserRole } from "@/services/user-service";

import { useUsers } from "@/hooks/use-users";
import { formatDateTime } from "@/lib/date";
import { useAuthStore } from "@/store";
import { capitalizeFirst } from "@/lib/utils";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users — CareGuard" }] }),
  component: UsersPage,
});

// const staff: User[] = [
//   {
//     id: "",
//     firstName: "Ella",
//     lastName: " Morgan",
//     role: UserRole.MANAGER,
//     email: "ella.morgan@elmwood.care",
//     isActive: true,
//   },
//   {
//     id: "3",
//     firstName: "James",
//     lastName: "Owusu",
//     role: UserRole.CARE_STAFF,
//     email: "j.owusu@elmwood.care",
//     isActive: true,
//   },
//   {
//     id: "3",
//     firstName: "Tom",
//     lastName: "Fletcher",
//     role: UserRole.MANAGER,
//     email: "t.fletcher@elmwood.care",
//     isActive: false,
//   },
// ];

function UsersPage() {
  const { data: staff = [], isLoading, isError, error } = useUsers();

  const user = useAuthStore((state) => state.user);

  const [editUser, setEditUser] = useState<User | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reset, setReset] = useState<string | null>(null);
  const [archive, setArchive] = useState<string | null>(null);

  console.log(staff);

  return (
    <AppShell>
      <SectionHeader
        title="Users"
        description="Manage care staff, roles and access to compliance systems."
        action={
          <button
            onClick={() => setInviteOpen(true)}
            data-inspection-hide
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <UserPlus className="h-3.5 w-3.5" /> Invite user
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff
                .filter((u) => u.id !== user?.id && u.id !== "system")
                .map((u) => (
                  <tr
                    key={u.email}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                          {capitalizeFirst(
                            u.firstName
                              .split(" ")
                              .map((n) => n[0])
                              .join(""),
                          )}
                        </div>
                        <span className="font-medium">
                          {capitalizeFirst(`${u.firstName} ${u.lastName}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(u.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive ? "success" : "critical"}>
                        {u.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditUser(u)}
                          title="Edit"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setReset(u.firstName)}
                          title="Reset password"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        {/* <button
                        onClick={() => setArchive(u.firstName)}
                        title="Deactivate"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Archive className="h-4 w-4" />
                      </button> */}
                        {/* <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <UserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <UserModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser ?? undefined} />
      <ResetPasswordDialog open={!!reset} onClose={() => setReset(null)} userLabel={reset ?? ""} />
      <ArchiveDialog open={!!archive} onClose={() => setArchive(null)} itemLabel={archive ?? ""} />
    </AppShell>
  );
}
