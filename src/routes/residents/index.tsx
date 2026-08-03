import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Archive,
  Pencil, // or SquarePen
} from "lucide-react";
import { AddResidentModal, ArchiveDialog } from "@/components/modals";

import { useResidents, useArchiveResident } from "@/hooks/use-residents";
import { Resident } from "@/services/resident-service";

// export const Route = createFileRoute("/residents/")({
//   head: () => ({ meta: [{ title: "Residents — CareGuard" }] }),
//   component: ResidentsPage,
// });

export const Route = createFileRoute("/residents/")({
  component: ResidentsPage,
});

const STATUS_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Stable", value: "STABLE" },
  { label: "New Admission", value: "NEW_ADMISSION" },
  { label: "Palliative", value: "PALLIATIVE" },
  { label: "Requires Review", value: "REQUIRES_REVIEW" },
] as const;

function ResidentsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [archive, setArchive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [resident, setResident] = useState<Resident | null>(null);

  const { data: residents = [], isLoading } = useResidents();
  const archiveResident = useArchiveResident();

  // Combined filtering + pagination
  const filteredAndPaginated = useMemo(() => {
    let result = [...residents];

    // Search filter
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((resident) => {
        const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
        const caregiver = resident.primaryCaregiver
          ? `${resident.primaryCaregiver.firstName} ${resident.primaryCaregiver.lastName}`.toLowerCase()
          : "";

        return (
          fullName.includes(q) ||
          resident.roomNumber?.toLowerCase().includes(q) ||
          caregiver.includes(q)
        );
      });
    }

    // Status filter
    // if (statusFilter !== "All") {
    //   result = result.filter(
    //     (resident) =>
    //       resident.status.toLowerCase() === statusFilter.toLowerCase() ||
    //       resident.condition.toLowerCase().includes(statusFilter.toLowerCase()),
    //   );
    // }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(
        (resident) => resident.status === statusFilter || resident.condition === statusFilter,
      );
    }

    const totalPages = Math.ceil(result.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = result.slice(start, start + itemsPerPage);

    return { data: paginated, total: result.length, totalPages };
  }, [residents, query, statusFilter, currentPage]);

  const { data: filteredResidents, total, totalPages } = filteredAndPaginated;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  console.log({ residents });

  return (
    <AppShell>
      <SectionHeader
        title="Residents"
        description="Manage resident records, review cycles and compliance status."
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add resident
          </button>
        }
      />

      <Card className="overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
              placeholder="Search by name, room or caregiver"
              className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm outline-none focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1">
            {/* Status Filters */}
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === option.value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === status
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))} */}
          </div>

          <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
            <Filter className="h-3.5 w-3.5" /> More Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Primary caregiver</th>
                <th className="px-4 py-3">Admitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    Loading residents...
                  </td>
                </tr>
              ) : filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No residents match your search.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r: Resident) => {
                  const fullName = `${r.firstName} ${r.lastName}`;
                  const caregiverName = r.primaryCaregiver
                    ? `${r.primaryCaregiver.firstName} ${r.primaryCaregiver.lastName}`
                    : "Not assigned";
                  const age = new Date().getFullYear() - new Date(r.dateOfBirth).getFullYear();

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {r.firstName[0]}
                            {r.lastName[0]}
                          </div>
                          <div>
                            <Link
                              to="/residents/$id"
                              params={{ id: r.id }}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {fullName}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              Room {r.roomNumber || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{age}</td>
                      <td className="px-4 py-3 font-medium">{r.roomNumber || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{caregiverName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral">{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="success">{r.condition.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to="/residents/$id"
                            params={{ id: r.id }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setResident(r);
                              setAddOpen(true);
                            }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-blue-600"
                            title="Edit resident"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setArchive(r.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, total)} of {total} residents
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-7 w-7 rounded-md text-xs font-medium ${
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-secondary"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <AddResidentModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setResident(null);
        }}
        resident={resident}
      />
      <ArchiveDialog open={!!archive} onClose={() => setArchive(null)} itemLabel={archive ?? ""} />
    </AppShell>
  );
}
