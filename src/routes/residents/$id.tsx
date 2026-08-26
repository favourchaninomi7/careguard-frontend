import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Pill,
  FileText,
  ShieldCheck,
  ScrollText,
  Paperclip,
  Pencil,
  Users as UsersIcon,
} from "lucide-react";
import {
  AddResidentModal,
  CreateCareRecordModal,
  RecordMedicationModal,
  VerifyRecordDialog,
} from "@/components/modals";
import { ReplayHistoryButton } from "@/components/integrity-playback";
import { useResident } from "@/hooks/use-residents";
import { Resident } from "@/services";
import { useAuditByEntity } from "@/hooks/use-audit-logs";

export const Route = createFileRoute("/residents/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Resident · ${params.id} — CareGuard` }],
  }),
  component: ResidentDetail,
});

const tabs = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "care", label: "Care plans", icon: FileText },
  { id: "meds", label: "Medication", icon: Pill },
  { id: "history", label: "Medical history", icon: ScrollText },
  { id: "integrity", label: "Integrity history", icon: ShieldCheck },
  { id: "audit", label: "Audit timeline", icon: ScrollText },
  // { id: "docs", label: "Documents", icon: Paperclip },
  { id: "contacts", label: "Emergency contacts", icon: UsersIcon },
  { id: "notes", label: "Notes", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

function ageFromDob(dob?: string | null) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

function conditionTone(condition?: string) {
  if (!condition) return "info" as const;
  if (condition === "REQUIRES_REVIEW") return "warning" as const;
  if (condition === "CRITICAL") return "critical" as const;
  return "success" as const;
}

function ResidentDetail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<TabId>("overview");
  const [addCare, setAddCare] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addMed, setAddMed] = useState(false);
  const [verify, setVerify] = useState<{ id: string; hash: string } | null>(null);
  const [resident, setResident] = useState<Resident | null>(null);

  const { data: residentData, isLoading, isError } = useResident(id);

  const { data: auditEvents = [], isLoading: auditLoading } = useAuditByEntity(
    "Resident",
    id,
    tab === "audit", // only fetch when tab is open
  );

  const displayName = residentData
    ? `${residentData.firstName} ${residentData.lastName}`
    : "Resident";

  const initials = residentData
    ? `${residentData.firstName?.[0] ?? ""}${residentData.lastName?.[0] ?? ""}`
    : "—";

  const age = ageFromDob(residentData?.dateOfBirth);
  const caregiver = residentData?.primaryCaregiver
    ? `${residentData.primaryCaregiver.firstName} ${residentData.primaryCaregiver.lastName}`
    : "—";

  const careRecords = residentData?.careRecords ?? [];
  const meds = residentData?.medicationRecords ?? [];
  const contacts = residentData?.emergencyContacts ?? [];
  const integrity = residentData?.integrityHashes ?? [];

  const verifiedCount = integrity.filter((h: any) => h.status === "VERIFIED").length;
  const failedCount = integrity.filter((h: any) => h.status === "FAILED").length;
  const allVerified = integrity.length > 0 && failedCount === 0;

  const medicalHistory = useMemo(() => {
    const care = (residentData?.careRecords ?? []).map((r: any) => ({
      id: r.id,
      at: r.recordedAt,
      kind: "care" as const,
      title: r.title || r.type,
      detail: r.content?.slice?.(0, 120) || r.type,
      by: r.recordedBy ? `${r.recordedBy.firstName} ${r.recordedBy.lastName}` : undefined,
    }));

    const meds = (residentData?.medicationRecords ?? []).map((r: any) => ({
      id: r.id,
      at: r.administeredAt || r.createdAt,
      kind: "med" as const,
      title: `${r.medicationName} ${r.dosage || ""}`.trim(),
      detail: r.status,
      by: r.administeredBy
        ? `${r.administeredBy.firstName} ${r.administeredBy.lastName}`
        : undefined,
    }));

    return [...care, ...meds].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [residentData]);

  const clinicalSummary = residentData?.medicalNotes?.trim() || null;

  const medicationNotes = (residentData?.medicationRecords ?? [])
    .filter((m: any) => m.notes?.trim())
    .map((m: any) => ({
      id: m.id,
      title: `${m.medicationName} ${m.dosage || ""}`.trim(),
      content: m.notes,
      at: m.administeredAt || m.createdAt,
    }));

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading resident…</p>
      </AppShell>
    );
  }

  if (isError || !residentData) {
    return (
      <AppShell>
        <p className="text-sm text-critical">Resident not found.</p>
        <Link to="/residents" className="mt-2 text-xs text-primary hover:underline">
          Back to residents
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/residents" className="inline-flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" /> Residents
        </Link>
        <span>/</span>
        <span className="text-foreground">{displayName}</span>
      </div>

      {/* Header card */}
      <Card className="mb-4 p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary-soft text-2xl font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <Badge tone={conditionTone(residentData.condition)}>
                {residentData.condition?.replace(/_/g, " ") || residentData.status || "—"}
              </Badge>
              {residentData.roomNumber && <Badge tone="info">Room {residentData.roomNumber}</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {residentData.nhsNumber ? `NHS #${residentData.nhsNumber} · ` : ""}
              {age != null ? `Age ${age} · ` : ""}
              Admitted {formatDate(residentData.admissionDate)} · Primary caregiver {caregiver}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {contacts[0]?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {contacts[0].phone}
                </span>
              )}
              {contacts[0]?.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {contacts[0].email}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Elmwood Grove
                {residentData.roomNumber ? ` · Room ${residentData.roomNumber}` : ""}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ReplayHistoryButton
              entityType="Resident"
              recordId={residentData.id}
              recordTitle={displayName}
            />
            <button
              onClick={() => setAddCare(true)}
              data-inspection-hide
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <FileText className="h-3.5 w-3.5" /> Care record
            </button>
            <button
              onClick={() => setAddMed(true)}
              data-inspection-hide
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <Pill className="h-3.5 w-3.5" /> Medication
            </button>
            <button
              onClick={() => {
                setResident(residentData);
                console.log(residentData);
                setAddOpen(true);
              }}
              data-inspection-hide
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit resident
            </button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold transition " +
                (active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="Care summary" />
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Medical conditions</span>
                <span className="text-right font-medium">
                  {residentData.medicalNotes || residentData.condition || "—"}
                </span>
              </li>
              <li className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Allergies</span>
                <span className="text-right font-medium">
                  {residentData.allergies || "None recorded"}
                </span>
              </li>
              <li className="flex justify-between gap-4 border-b border-border pb-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-right font-medium">{residentData.status || "—"}</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">Date of birth</span>
                <span className="text-right font-medium">
                  {formatDate(residentData.dateOfBirth)}
                  {age != null ? ` (${age} yrs)` : ""}
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold">Latest integrity</h3>
            <div
              className={
                "mt-3 rounded-xl border p-4 " +
                (allVerified
                  ? "border-success/30 bg-success-soft"
                  : failedCount > 0
                    ? "border-critical/30 bg-critical-soft"
                    : "border-border bg-secondary/40")
              }
            >
              <div
                className={
                  "grid h-10 w-10 place-items-center rounded-full " +
                  (allVerified
                    ? "bg-success text-success-foreground"
                    : failedCount > 0
                      ? "bg-critical text-critical-foreground"
                      : "bg-secondary text-muted-foreground")
                }
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p
                className={
                  "mt-2 text-sm font-semibold " +
                  (allVerified
                    ? "text-success"
                    : failedCount > 0
                      ? "text-critical"
                      : "text-foreground")
                }
              >
                {integrity.length === 0
                  ? "No integrity records yet"
                  : allVerified
                    ? "All records verified"
                    : `${failedCount} integrity issue(s)`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {verifiedCount}/{integrity.length || 0} verified for this resident
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Care records */}
      {tab === "care" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-sm font-semibold">Care records</h3>
            <button
              onClick={() => setAddCare(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              New care record
            </button>
          </div>
          {careRecords.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No care records yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {careRecords.map((r: any) => (
                <li key={r.id} className="flex items-center gap-4 p-4 hover:bg-secondary/40">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.title || r.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.id} · {formatRelative(r.recordedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setVerify({
                        id: r.id,
                        hash: r.integrity?.currentHash || r.integrityHashes?.[0]?.currentHash || "",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Verify integrity
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Medication */}
      {tab === "meds" && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active medications</h3>
            <button
              onClick={() => setAddMed(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Record medication
            </button>
          </div>
          {meds.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No medication records yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {meds.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {r.medicationName} {r.dosage}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.status} · {formatRelative(r.administeredAt)}
                    </p>
                  </div>
                  <Badge tone={r.status === "ADMINISTERED" ? "success" : "warning"}>
                    {r.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Integrity history */}
      {tab === "integrity" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Integrity history</h3>
          {integrity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No integrity history yet.</p>
          ) : (
            <ol className="relative mt-4 space-y-4 border-l border-border pl-6">
              {integrity.map((e: any) => (
                <li key={e.id} className="relative">
                  <span
                    className={
                      "absolute -left-[27px] top-1 h-4 w-4 rounded-full ring-4 ring-card " +
                      (e.status === "VERIFIED"
                        ? "bg-success"
                        : e.status === "FAILED"
                          ? "bg-critical"
                          : "bg-warning")
                    }
                  />
                  <p className="text-sm font-medium">
                    {e.entityType} · v{e.versionNumber} · {e.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(e.verifiedAt || e.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {/* Emergency contacts */}
      {tab === "contacts" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Emergency contacts</h3>
          {contacts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No emergency contacts recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {contacts.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{c.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.relationship}
                      {c.isPrimary ? " · primary NOK" : ""}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">{c.phone}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "history" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Medical history</h3>
          {medicalHistory.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No clinical events recorded yet.</p>
          ) : (
            <ol className="relative mt-4 space-y-4 border-l border-border pl-6">
              {medicalHistory.map((e) => (
                <li key={`${e.kind}-${e.id}`} className="relative">
                  <span
                    className={
                      "absolute -left-[27px] top-1 h-4 w-4 rounded-full ring-4 ring-card " +
                      (e.kind === "med" ? "bg-primary" : "bg-success")
                    }
                  />
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(e.at)}
                    {e.by ? ` · ${e.by}` : ""}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {tab === "audit" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Audit timeline</h3>
          {auditLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading audit events…</p>
          ) : auditEvents.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No audit events for this resident yet.
            </p>
          ) : (
            <ol className="relative mt-4 space-y-4 border-l border-border pl-6">
              {auditEvents.map((e: any) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-card" />
                  <p className="text-sm font-medium">
                    {e.user?.name ?? "System"}{" "}
                    <span className="text-muted-foreground">{e.actionLabel || e.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(e.timestamp)}
                    {e.ipAddress ? ` · IP ${e.ipAddress}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {tab === "notes" && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Notes</h3>

          {clinicalSummary && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Clinical summary
              </p>
              <p className="mt-1 text-sm">{clinicalSummary}</p>
            </div>
          )}

          {medicationNotes.length === 0 && !clinicalSummary ? (
            <p className="mt-4 text-sm text-muted-foreground">No notes recorded yet.</p>
          ) : medicationNotes.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {medicationNotes.map(
                (n: { id: string; title: string; content: string; at: string }) => (
                  <li key={n.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.content}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{formatRelative(n.at)}</p>
                  </li>
                ),
              )}
            </ul>
          ) : null}
        </Card>
      )}

      {/* Empty placeholders for remaining tabs */}
      {["docs"].includes(tab) && (
        <Card className="p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold">
            No {tabs.find((t) => t.id === tab)?.label.toLowerCase()} yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Records added here will be hashed and appended to the audit ledger automatically.
          </p>
        </Card>
      )}

      <CreateCareRecordModal
        open={addCare}
        onClose={() => setAddCare(false)}
        // if your modal accepts residentId:
        // residentId={resident.id}
      />
      <RecordMedicationModal
        open={addMed}
        onClose={() => setAddMed(false)}
        // residentId={resident.id}
      />

      <AddResidentModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setResident(null);
        }}
        resident={resident}
      />
      <VerifyRecordDialog
        open={!!verify}
        onClose={() => setVerify(null)}
        recordId={verify?.id ?? ""}
        storedHash={verify?.hash ?? ""}
      />
    </AppShell>
  );
}
