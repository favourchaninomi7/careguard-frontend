import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import {
  FileText,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  CreateCareRecordModal,
  VerifyRecordDialog,
  FloatingActionButton,
  ArchiveDialog,
  ViewCareRecordModal,
} from "@/components/modals";
import { ReplayHistoryButton } from "@/components/integrity-playback";
import { useCareRecords, useCareRecordsStats, useCreateCareRecord } from "@/hooks/use-care-records";
import { formatDistanceToNow } from "date-fns"; // optional for "X min ago"
import { fakeSha256 } from "@/lib/hash";
import { CareRecord } from "@/services/care-records-service";

export const Route = createFileRoute("/care-records")({
  head: () => ({ meta: [{ title: "Care Records — CareGuard" }] }),
  component: CareRecordsPage,
});

const tone = (s: string) =>
  s === "VERIFIED"
    ? ("success" as const)
    : s === "PENDING"
      ? ("info" as const)
      : s === "FAILED"
        ? ("critical" as const)
        : ("warning" as const);

function CareRecordsPage() {
  const [create, setCreate] = useState(false);
  const [verify, setVerify] = useState<{ id: string; hash: string } | null>(null);
  const [archive, setArchive] = useState<string | null>(null);

  const [view, setView] = useState<CareRecord | null>(null);
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 20;

  // Data Fetching
  const { data: recordsData, isLoading } = useCareRecords(page, limit);
  const { data: stats } = useCareRecordsStats();

  const records = recordsData?.data || [];

  const transformRecord = (r: any) => ({
    id: r.id,
    title: r.title,
    resident: `${r.resident?.firstName} ${r.resident?.lastName}`,
    by: `${r.recordedBy?.firstName} ${r.recordedBy?.lastName}`,
    updated: formatDistanceToNow(new Date(r.recordedAt), { addSuffix: true }),
    // status: r.status || "PENDING",
    status: r.integrity?.status || "PENDING",
    hash: r.integrity?.currentHash
      ? r.integrity.currentHash.slice(0, 4) + "…" + r.integrity.currentHash.slice(-4)
      : "—",
    time: new Date(r.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  return (
    <AppShell>
      <SectionHeader
        title="Care Records"
        description="Immutable care documentation with SHA-256 integrity verification on every save."
        action={
          <button
            onClick={() => setCreate(true)}
            data-inspection-hide
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <FileText className="h-3.5 w-3.5" /> New record
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { l: "Total records", v: stats?.data.totalRecords?.toLocaleString() || "—" },
          { l: "Verified today", v: stats?.data.verifiedToday?.toLocaleString() || "—" },
          { l: "Pending review", v: stats?.data.pendingReview?.toLocaleString() || "—" },
          {
            l: "Failed integrity",
            v: stats?.data.failedIntegrity?.toLocaleString() || "—",
            tone: "critical" as const,
          },
        ].map((s) => (
          <Card key={s.l} className="p-4">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p
              className={
                "mt-1 text-xl font-semibold " +
                (s.tone === "critical" ? "text-critical" : "text-foreground")
              }
            >
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Created by</th>
                <th className="px-4 py-3">Last updated</th>
                <th className="px-4 py-3">Hash</th>
                <th className="px-4 py-3">Verified at</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: CareRecord) => {
                const item = transformRecord(r);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.id}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.resident}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.by}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.updated}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-mono">
                        {item.hash}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.time}</td>
                    <td className="px-4 py-3">
                      <Badge tone={tone(item.status)}>
                        <ShieldCheck className="h-3 w-3" /> {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setVerify({ id: r.id, hash: item.hash })}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Verify integrity"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <ReplayHistoryButton recordId={r.id} recordTitle={r.title} variant="icon" />
                        <button
                          onClick={() => {
                            setView(r);
                            console.log({ r });
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setArchive(r.title)}
                          data-inspection-hide
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          title="Archive"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {recordsData?.meta && (
          <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, recordsData.meta.total)} of{" "}
              {recordsData.meta.total} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: Math.min(5, recordsData.meta.totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={
                      "h-7 w-7 rounded-md text-xs font-medium " +
                      (p === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-secondary")
                    }
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(recordsData.meta.totalPages, p + 1))}
                disabled={page === recordsData.meta.totalPages}
                className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary disabled:opacity-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <FloatingActionButton onClick={() => setCreate(true)}>
        <Plus className="h-4 w-4" /> New care record
      </FloatingActionButton>

      <CreateCareRecordModal open={create} onClose={() => setCreate(false)} />
      <VerifyRecordDialog
        open={!!verify}
        onClose={() => setVerify(null)}
        recordId={verify?.id ?? ""}
        storedHash={verify?.hash ?? ""}
      />

      <ViewCareRecordModal
        open={!!view}
        onClose={() => setView(null)}
        record={view}
        onVerify={() => {
          if (view) setVerify({ id: view.id, hash: fakeSha256(view.id) });
          setView(null);
        }}
      />
      <ArchiveDialog open={!!archive} onClose={() => setArchive(null)} itemLabel={archive ?? ""} />
    </AppShell>
  );
}
