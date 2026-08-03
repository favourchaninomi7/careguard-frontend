import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { Pill, AlertTriangle, Check, Clock, Plus } from "lucide-react";
import { RecordMedicationModal } from "@/components/modals";

export const Route = createFileRoute("/medicationold")({
  head: () => ({ meta: [{ title: "Medication Records — CareGuard" }] }),
  component: MedicationPage,
});

const schedule = [
  { time: "08:00", resident: "Margaret Ellis", room: "204", med: "Ramipril 5mg", route: "Oral", status: "Administered", by: "James Owusu" },
  { time: "08:00", resident: "Arthur Whitfield", room: "118", med: "Metformin 500mg", route: "Oral", status: "Administered", by: "Priya Shah" },
  { time: "10:00", resident: "Beatrice Coleman", room: "302", med: "Paracetamol 1g", route: "Oral", status: "Administered", by: "Ella Morgan" },
  { time: "12:00", resident: "Nora Blake", room: "109", med: "Warfarin 3mg", route: "Oral", status: "Missed", by: "—" },
  { time: "14:00", resident: "Frank Doyle", room: "215", med: "Insulin (Novorapid)", route: "SC", status: "Due", by: "—" },
  { time: "18:00", resident: "Henry Ashford", room: "221", med: "Atorvastatin 20mg", route: "Oral", status: "Scheduled", by: "—" },
];

const tone = (s: string) =>
  s === "Administered" ? ("success" as const) : s === "Missed" ? ("critical" as const) : s === "Due" ? ("warning" as const) : ("info" as const);

function MedicationPage() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell>
      <SectionHeader
        title="Medication Records"
        description="MAR sheets and administration logs — every entry hashed at signature."
        action={
          <button
            onClick={() => setOpen(true)}
            data-inspection-hide
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Record medication
          </button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: "Doses today", v: "342", icon: Pill, tone: "info" as const },
          { l: "Administered", v: "318", icon: Check, tone: "success" as const },
          { l: "Due within 1 hr", v: "18", icon: Clock, tone: "warning" as const },
          { l: "Missed", v: "1", icon: AlertTriangle, tone: "critical" as const },
        ].map((s) => {
          const Icon = s.icon;
          const toneBg: Record<string, string> = {
            info: "bg-primary-soft text-primary",
            success: "bg-success-soft text-success",
            warning: "bg-warning-soft text-warning-foreground",
            critical: "bg-critical-soft text-critical",
          };
          return (
            <Card key={s.l} className="flex items-center gap-3 p-4">
              <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneBg[s.tone]}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.l}</p>
                <p className="text-xl font-semibold">{s.v}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Today's medication schedule</h3>
            <Badge tone="info">Monday, 6 Jul 2026</Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Resident</th>
                  <th className="py-2 pr-3">Medication</th>
                  <th className="py-2 pr-3">Route</th>
                  <th className="py-2 pr-3">Signed by</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((s, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 pr-3 font-mono text-xs">{s.time}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{s.resident}</p>
                      <p className="text-xs text-muted-foreground">Room {s.room}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.med}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.route}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{s.by}</td>
                    <td className="py-3 pr-3">
                      <Badge tone={tone(s.status)}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold">Missed medication alert</h3>
          <div className="mt-3 rounded-xl border border-critical/30 bg-critical-soft p-4">
            <div className="flex items-center gap-2 text-critical">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-semibold">Nora Blake · Room 109</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Warfarin 3mg scheduled for 12:00 was not administered. Escalated to on-duty
              nurse and logged to audit trail.
            </p>
            <button data-inspection-hide className="mt-3 w-full rounded-lg bg-critical px-3 py-2 text-xs font-semibold text-critical-foreground hover:bg-critical/90">
              Record intervention
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance this week</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-3xl font-semibold">98.6%</p>
              <Badge tone="success">On target</Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-success" style={{ width: "98.6%" }} />
            </div>
          </div>
        </Card>
      </div>

      <RecordMedicationModal open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}
