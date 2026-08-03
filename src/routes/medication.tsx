import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Pill, Plus } from "lucide-react";
import { format } from "date-fns";

import { AppShell } from "@/components/app-shell";
import { Badge, Card, SectionHeader } from "@/components/ui-kit";

import { useMedicationRecords } from "@/hooks/use-medication-records";
import {
  RecordMedicationModal,
  ContinueMedicationModal,
  MedicationDetailsModal,
  UpdateMedicationModal,
} from "@/components/modals";
import { MedicationRecord, MedicationStatus } from "@/services/medication-records-service";

export const Route = createFileRoute("/medication")({
  head: () => ({
    meta: [
      {
        title: "Medication Records — CareGuard",
      },
    ],
  }),
  component: MedicationPage,
});

const tone = (status: MedicationStatus) => {
  switch (status) {
    case MedicationStatus.ADMINISTERED:
      return "success" as const;

    case MedicationStatus.REFUSED:
      return "critical" as const;

    case MedicationStatus.MISSED:
      return "critical" as const;

    default:
      return "warning" as const;
  }
};

function MedicationPage() {
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const [continueModalOpen, setContinueModalOpen] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<MedicationRecord | null>(null);

  const [open, setOpen] = useState(false);

  const [page, setPage] = useState(1);

  const limit = 10;

  const { data, isLoading } = useMedicationRecords({
    page,
    limit,
  });

  const records = data?.data ?? [];

  const pagination = data?.pagination;

  const stats = useMemo(() => {
    return {
      total: records.length,

      administered: records.filter((r) => r.status === MedicationStatus.ADMINISTERED).length,

      missed: records.filter((r) => r.status === MedicationStatus.MISSED).length,

      due: records.filter(
        (r) => r.remainingCount > 0 && r.nextDueAt && new Date(r.nextDueAt) <= new Date(),
      ).length,
    };
  }, [records]);

  return (
    <AppShell>
      <SectionHeader
        title="Medication Records"
        description="MAR sheets and administration logs — every entry hashed and verifiable."
        action={
          <button
            onClick={() => setRecordModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Record medication
          </button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        {[
          {
            label: "Medication Records",
            value: stats.total,
            icon: Pill,
            tone: "info",
          },
          {
            label: "Administered",
            value: stats.administered,
            icon: Check,
            tone: "success",
          },
          {
            label: "Due",
            value: stats.due,
            icon: Clock,
            tone: "warning",
          },
          {
            label: "Missed",
            value: stats.missed,
            icon: AlertTriangle,
            tone: "critical",
          },
        ].map((card) => {
          const Icon = card.icon;

          const toneBg: Record<string, string> = {
            info: "bg-primary-soft text-primary",
            success: "bg-success-soft text-success",
            warning: "bg-warning-soft text-warning-foreground",
            critical: "bg-critical-soft text-critical",
          };

          return (
            <Card key={card.label} className="flex items-center gap-3 p-4">
              <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneBg[card.tone]}>
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>

                <p className="text-xl font-semibold">{card.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="text-sm font-semibold">Medication Records</h3>

          <Badge tone="info">{pagination?.total ?? 0} Records</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Time</th>

                <th className="py-3 px-4">Resident</th>

                <th className="py-3 px-4">Medication</th>

                <th className="py-3 px-4">Frequency</th>

                <th className="py-3 px-4">Remaining</th>

                <th className="py-3 px-4">Next Due</th>

                <th className="py-3 px-4">Signed By</th>

                <th className="py-3 px-4">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
                    Loading medication records...
                  </td>
                </tr>
              )}

              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
                    No medication records found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                records.map((record: MedicationRecord) => (
                  <tr
                    key={record.id}
                    onClick={() => {
                      setSelectedRecord(record);
                      setDetailsModalOpen(true);
                    }}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {format(new Date(record.administeredAt), "HH:mm")}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {record.resident.firstName} {record.resident.lastName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Room {record.resident.roomNumber ?? "-"}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium">{record.medicationName}</p>

                      <p className="text-xs text-muted-foreground">{record.dosage}</p>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      Every {record.intervalValue} {record.intervalUnit.toLowerCase()}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone="info">{record.remainingCount}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      {record.nextDueAt ? (
                        <div>
                          <p className="font-medium">
                            {format(new Date(record.nextDueAt), "dd MMM")}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {format(new Date(record.nextDueAt), "HH:mm")}
                          </p>
                        </div>
                      ) : record.remainingCount > 0 ? (
                        "-"
                      ) : (
                        <span className="text-muted-foreground">Completed</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {record.administeredBy.firstName} {record.administeredBy.lastName}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={tone(record.status)}>{record.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setDetailsModalOpen(true);
                        }}
                        className="text-primary hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>{" "}
        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            Showing {records.length === 0 ? 0 : (page - 1) * limit + 1}
            {" - "}
            {Math.min(page * limit, pagination?.total ?? 0)} of {pagination?.total ?? 0}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination?.hasPreviousPage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from(
              {
                length: pagination?.totalPages ?? 0,
              },
              (_, i) => i + 1,
            )
              .slice(Math.max(0, page - 3), Math.max(5, page + 2))
              .map((number) => (
                <button
                  key={number}
                  onClick={() => setPage(number)}
                  className={`h-9 min-w-[36px] rounded-lg border text-sm transition ${
                    number === page
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {number}
                </button>
              ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination?.hasNextPage}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* <RecordMedicationModal open={open} onClose={() => setOpen(false)} /> */}
      <RecordMedicationModal open={recordModalOpen} onClose={() => setRecordModalOpen(false)} />

      <MedicationDetailsModal
        open={detailsModalOpen}
        record={selectedRecord}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedRecord(null);
        }}
        onContinue={(record) => {
          setDetailsModalOpen(false);
          setSelectedRecord(record);
          setContinueModalOpen(true);
        }}
        onUpdate={(record) => {
          setDetailsModalOpen(false);
          setSelectedRecord(record);
          setUpdateModalOpen(true);
        }}
        onVerify={(record) => {
          console.log("Verify", record.id);
        }}
      />

      <ContinueMedicationModal
        open={continueModalOpen}
        record={selectedRecord}
        onClose={() => {
          setContinueModalOpen(false);
          setSelectedRecord(null);
        }}
      />

      <UpdateMedicationModal
        open={updateModalOpen}
        record={selectedRecord}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedRecord(null);
        }}
      />
    </AppShell>
  );
}
