import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Badge } from "@/components/ui-kit";
import { useInspection } from "@/lib/inspection";
import { ReplayHistoryButton } from "@/components/integrity-playback";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Users,
  FileCheck2,
  Pill,
  ScrollText,
  ClipboardCheck,
  UserCog,
  AlertTriangle,
  FileDown,
  Printer,
  FileText,
  Signature,
  Clock,
  CheckCircle2,
  Search,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fakeSha256, shortHash } from "@/lib/hash";

export const Route = createFileRoute("/inspection")({
  head: () => ({ meta: [{ title: "CQC Inspection Mode — CareGuard" }] }),
  component: InspectionDashboard,
});

const kpis = [
  { l: "Total Residents", v: "128", icon: Users, tone: "info" as const },
  { l: "Verified Records", v: "18,204", icon: FileCheck2, tone: "success" as const },
  { l: "Medication Compliance", v: "98.6%", icon: Pill, tone: "success" as const },
  { l: "Open Incidents", v: "3", icon: AlertTriangle, tone: "warning" as const },
  { l: "Integrity Alerts", v: "0", icon: ShieldCheck, tone: "success" as const },
  { l: "Pending Reviews", v: "17", icon: Clock, tone: "warning" as const },
  { l: "Audit Events (24h)", v: "412", icon: ScrollText, tone: "info" as const },
  { l: "Staff Activity", v: "42", icon: UserCog, tone: "info" as const },
];

const scorecard = [
  {
    c: "Resident Records",
    pct: 99,
    status: "Current",
    updated: "Today 09:42",
    rating: "Outstanding",
  },
  { c: "Care Plans", pct: 96, status: "Current", updated: "Today 12:41", rating: "Good" },
  { c: "Medication Records", pct: 98, status: "Current", updated: "Today 12:00", rating: "Good" },
  { c: "Audit Logs", pct: 100, status: "Sealed", updated: "03:00", rating: "Outstanding" },
  {
    c: "Integrity Verification",
    pct: 100,
    status: "Verified",
    updated: "12m ago",
    rating: "Outstanding",
  },
  { c: "Documentation", pct: 92, status: "2 pending", updated: "Yesterday", rating: "Good" },
  { c: "Emergency Contacts", pct: 97, status: "Current", updated: "04 Jul", rating: "Good" },
  { c: "Staff Compliance", pct: 95, status: "Training current", updated: "01 Jul", rating: "Good" },
];

const residentsCompliance = [
  {
    name: "Margaret Ellis",
    room: "204",
    care: "Current",
    meds: "On schedule",
    review: "12 Jul",
    integrity: "Verified",
    pct: 99,
  },
  {
    name: "Arthur Whitfield",
    room: "118",
    care: "Current",
    meds: "On schedule",
    review: "18 Jul",
    integrity: "Verified",
    pct: 98,
  },
  {
    name: "Beatrice Coleman",
    room: "302",
    care: "Review due",
    meds: "On schedule",
    review: "10 Jul",
    integrity: "Verified",
    pct: 92,
  },
  {
    name: "Henry Ashford",
    room: "221",
    care: "Current",
    meds: "On schedule",
    review: "22 Jul",
    integrity: "Verified",
    pct: 100,
  },
  {
    name: "Nora Blake",
    room: "109",
    care: "Current",
    meds: "Missed 1",
    review: "09 Jul",
    integrity: "Verified",
    pct: 88,
  },
  {
    name: "Frank Doyle",
    room: "215",
    care: "Current",
    meds: "On schedule",
    review: "15 Jul",
    integrity: "Verified",
    pct: 97,
  },
];

const medsWeek = [
  { d: "Mon", admin: 340, missed: 2, late: 3, pending: 4 },
  { d: "Tue", admin: 352, missed: 0, late: 1, pending: 2 },
  { d: "Wed", admin: 348, missed: 1, late: 4, pending: 3 },
  { d: "Thu", admin: 350, missed: 0, late: 2, pending: 2 },
  { d: "Fri", admin: 344, missed: 2, late: 3, pending: 1 },
  { d: "Sat", admin: 330, missed: 1, late: 2, pending: 3 },
  { d: "Sun", admin: 325, missed: 0, late: 1, pending: 2 },
];

// const complianceTrend = medsWeek.map((w) => ({ d: w.d, pct: 96 + Math.random() * 3 }));
const [complianceTrend] = useState(() =>
  medsWeek.map((w) => ({
    d: w.d,
    pct: 96 + Math.random() * 3,
  })),
);

const auditTimeline = [
  { t: "12:41", u: "James Owusu", a: "Updated care plan", r: "CR-8834 · Margaret Ellis", ok: true },
  {
    t: "12:18",
    u: "Priya Shah",
    a: "Recorded fall risk assessment",
    r: "CR-8833 · Arthur Whitfield",
    ok: true,
  },
  {
    t: "11:48",
    u: "Ella Morgan",
    a: "Signed nutrition log",
    r: "CR-8832 · Beatrice Coleman",
    ok: true,
  },
  { t: "10:52", u: "James Owusu", a: "Uploaded wound photo", r: "CR-8815 · Frank Doyle", ok: true },
  { t: "03:00", u: "System", a: "Nightly SHA-256 sweep", r: "18,204 records verified", ok: true },
];

const evidence = [
  { t: "Audit Logs", d: "Immutable ledger · 18,204 entries" },
  { t: "Resident Compliance Report", d: "All 128 residents · care plans & reviews" },
  { t: "Medication Compliance Report", d: "MAR sheets · 342 doses today" },
  { t: "Integrity Verification Report", d: "SHA-256 sweep results · 12m ago" },
  { t: "SHA-256 Verification Report", d: "Hash-chain proofs · signed" },
  { t: "Staff Activity Report", d: "42 staff · training and shifts" },
  { t: "Care Plan Summary", d: "Active plans by category" },
];

const risks = [
  {
    level: "Low",
    desc: "Emergency contact overdue update",
    records: 4,
    action: "Request confirmation via NOK portal",
    staff: "Priya Shah",
    target: "12 Jul",
  },
  {
    level: "Medium",
    desc: "Care plan review approaching due date",
    records: 2,
    action: "Schedule review meeting",
    staff: "James Owusu",
    target: "10 Jul",
  },
  {
    level: "High",
    desc: "Repeated late medication (>15 min)",
    records: 3,
    action: "Review staffing at 14:00 handover",
    staff: "Ella Morgan",
    target: "09 Jul",
  },
];

const alerts = [
  { title: "Medication Review Due", severity: "warning", record: "Nora Blake · Warfarin" },
  { title: "Care Plan Expired", severity: "critical", record: "Beatrice Coleman · EoL review" },
  { title: "Integrity Verification Passed", severity: "success", record: "Nightly sweep · 03:00" },
  { title: "Missing Emergency Contact", severity: "warning", record: "Room 118 · secondary NOK" },
  { title: "Documentation Incomplete", severity: "warning", record: "CR-8802 · signature pending" },
];

function ratingTone(r: string) {
  return r === "Outstanding"
    ? "success"
    : r === "Good"
      ? "info"
      : r === "Requires improvement"
        ? "warning"
        : "critical";
}

function InspectionDashboard() {
  const { active, sessionId } = useInspection();
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState("");

  const filtered = residentsCompliance.filter((r) =>
    !q ? true : r.name.toLowerCase().includes(q.toLowerCase()) || r.room.includes(q),
  );

  return (
    <AppShell>
      {!active && (
        <div className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground" />
            <div>
              <p className="font-semibold text-warning-foreground">
                Inspection Mode is not currently active.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Enable Inspection Mode from the top-bar to lock the application into a read-only,
                inspector-friendly view. The dashboard below still works as a preview.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Executive summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            CQC Inspection Snapshot · Elmwood Grove Care Home
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-6xl font-semibold tracking-tight text-foreground">98%</p>
              <p className="text-xs text-muted-foreground">Overall Compliance</p>
            </div>
            <Badge tone="success">
              <ShieldCheck className="h-3 w-3" /> CQC Ready
            </Badge>
            <div className="text-xs text-muted-foreground">
              <p>Session {sessionId || "—"}</p>
              <p>Manager: Ella Morgan</p>
              <p>Prepared: {new Date().toLocaleString("en-GB")}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {[
              { k: "Safe", v: 98 },
              { k: "Effective", v: 96 },
              { k: "Well-led", v: 97 },
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{x.k}</p>
                <p className="mt-1 text-xl font-semibold">{x.v}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: x.v + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Integrity verification
          </p>
          <div className="mt-3 rounded-2xl border border-success/30 bg-success-soft p-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-semibold text-success">Verified</p>
            <p className="text-[11px] text-muted-foreground">18,204 / 18,204 records</p>
          </div>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last run</dt>
              <dd>12 min ago</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duration</dt>
              <dd>2m 41s</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Failed</dt>
              <dd>0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Compliance</dt>
              <dd className="font-semibold text-success">100.00%</dd>
            </div>
          </dl>
          <Link
            to="/integrity"
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
          >
            View verification details
          </Link>
        </Card>
      </div>

      {/* KPI grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => {
          const Icon = k.icon;
          const map: Record<string, string> = {
            info: "bg-primary-soft text-primary",
            success: "bg-success-soft text-success",
            warning: "bg-warning-soft text-warning-foreground",
            critical: "bg-critical-soft text-critical",
          };
          return (
            <Card key={k.l} className="p-4">
              <div className={"grid h-8 w-8 place-items-center rounded-lg " + map[k.tone]}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-[11px] font-medium text-muted-foreground">{k.l}</p>
              <p className="text-xl font-semibold tabular-nums">{k.v}</p>
            </Card>
          );
        })}
      </div>

      {/* Scorecard */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Compliance scorecard</h3>
            <p className="text-xs text-muted-foreground">Category-by-category readiness</p>
          </div>
          <Badge tone="success">All fundamentals met</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last updated</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((r) => (
                <tr key={r.c} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{r.c}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={
                            "h-full " +
                            (r.pct === 100
                              ? "bg-success"
                              : r.pct >= 95
                                ? "bg-primary"
                                : "bg-warning")
                          }
                          style={{ width: r.pct + "%" }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.updated}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ratingTone(r.rating)}>{r.rating}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resident compliance table */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <h3 className="text-sm font-semibold">Resident compliance</h3>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search residents"
              className="h-8 w-56 rounded-lg border border-border bg-card pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Care plan</th>
                <th className="px-4 py-3">Medication</th>
                <th className="px-4 py-3">Review due</th>
                <th className="px-4 py-3">Integrity</th>
                <th className="px-4 py-3">Overall</th>
                <th className="px-4 py-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to="/residents/$id"
                      params={{ id: r.name.toLowerCase().replace(/\s+/g, "-") }}
                      className="font-medium hover:text-primary"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.room}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.care === "Current" ? "success" : "warning"}>{r.care}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.meds === "On schedule" ? "success" : "warning"}>{r.meds}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.review}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">
                      <ShieldCheck className="h-3 w-3" /> {r.integrity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{r.pct}%</td>
                  <td className="px-4 py-3 text-right">
                    <ReplayHistoryButton
                      recordId={"RES-" + r.room}
                      recordTitle={r.name}
                      variant="ghost"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Showing {filtered.length} of 128 residents · read-only</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <span
                key={p}
                className={
                  "grid h-6 w-6 place-items-center rounded-md text-[11px] " +
                  (p === 1 ? "bg-primary text-primary-foreground" : "border border-border")
                }
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Medication compliance & audit timeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Medication administration</h3>
              <p className="text-xs text-muted-foreground">This week · doses per day</p>
            </div>
            <Badge tone="success">98.6% avg</Badge>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={medsWeek} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="admin" fill="var(--success)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="missed" fill="var(--critical)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="late" fill="var(--warning)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pending" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={complianceTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  domain={[90, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Audit timeline (today)</h3>
            <Link to="/audit-logs" className="text-xs font-semibold text-primary hover:underline">
              Open full ledger
            </Link>
          </div>
          <ol className="relative mt-4 space-y-4 border-l border-success/40 pl-6">
            {auditTimeline.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 h-4 w-4 rounded-full bg-success ring-4 ring-card" />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs text-muted-foreground">{e.t}</span>
                  <p className="text-sm">
                    <span className="font-medium">{e.u}</span>{" "}
                    <span className="text-muted-foreground">{e.a}</span>
                  </p>
                  <Badge tone="success">Verified</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.r}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Risk assessment */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Risk assessment</h3>
            <p className="text-xs text-muted-foreground">Live risk matrix · updates continuously</p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {(["Low", "Medium", "High", "Critical"] as const).map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " +
                    (l === "Low"
                      ? "bg-success"
                      : l === "Medium"
                        ? "bg-primary"
                        : l === "High"
                          ? "bg-warning"
                          : "bg-critical")
                  }
                />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {risks.map((r) => {
            const tone: Record<string, string> = {
              Low: "success",
              Medium: "info",
              High: "warning",
              Critical: "critical",
            };
            return (
              <div key={r.desc} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={tone[r.level] as never}>{r.level}</Badge>
                  <span className="text-[11px] text-muted-foreground">Target {r.target}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{r.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">Affected records: {r.records}</p>
                <p className="mt-2 text-xs">
                  <span className="text-muted-foreground">Action:</span> {r.action}
                </p>
                <p className="text-xs">
                  <span className="text-muted-foreground">Assigned:</span> {r.staff}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Alerts centre */}
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-semibold">Alerts centre</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {alerts.map((a) => {
            const tone: Record<string, string> = {
              success: "border-success/30 bg-success-soft",
              warning: "border-warning/40 bg-warning-soft",
              critical: "border-critical/30 bg-critical-soft",
            };
            return (
              <li
                key={a.title}
                className={"flex items-start gap-3 rounded-xl border p-3 " + tone[a.severity]}
              >
                {a.severity === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle
                    className={
                      "mt-0.5 h-4 w-4 " +
                      (a.severity === "critical" ? "text-critical" : "text-warning-foreground")
                    }
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.record}</p>
                </div>
                <Badge
                  tone={
                    a.severity === "success"
                      ? "success"
                      : a.severity === "critical"
                        ? "critical"
                        : "warning"
                  }
                >
                  {a.severity === "success" ? "Resolved" : "Outstanding"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Evidence centre */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Evidence centre</h3>
            <p className="text-xs text-muted-foreground">Downloadable inspection artefacts</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90">
            <FileDown className="h-3.5 w-3.5" /> Export complete inspection report
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {evidence.map((e) => (
            <div key={e.t} className="flex flex-col rounded-xl border border-border p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{e.t}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.d}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary">
                  <FileDown className="h-3 w-3" /> PDF
                </button>
                <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary">
                  <FileDown className="h-3 w-3" /> CSV
                </button>
                <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-semibold hover:bg-secondary">
                  <Printer className="h-3 w-3" /> Print
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hash verification viewer */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Hash verification viewer</h3>
            <p className="text-xs text-muted-foreground">Technical proof for inspectors</p>
          </div>
          <Badge tone="success">
            <ShieldCheck className="h-3 w-3" /> All records match
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {["CR-8834", "CR-8833", "MED-4402", "CR-8815"].map((id) => {
            const h = fakeSha256(id);
            return (
              <div key={id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{id}</p>
                  <Badge tone="success">Verified</Badge>
                </div>
                <dl className="mt-2 space-y-1 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Current hash</dt>
                    <dd className="font-mono">{shortHash(h)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Stored hash</dt>
                    <dd className="font-mono">{shortHash(h)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Verified by</dt>
                    <dd>System sweep</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd>v5</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <ReplayHistoryButton recordId={id} recordTitle={id} variant="ghost" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Inspection report */}
      <Card className="mt-4 p-6 print:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Inspection report
            </p>
            <h3 className="mt-1 text-lg font-semibold">Executive summary — Elmwood Grove</h3>
          </div>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3 text-sm leading-relaxed">
            <p>
              Elmwood Grove Care Home currently sustains an overall compliance score of{" "}
              <strong>98%</strong> against the CQC Key Lines of Enquiry. All 18,204 immutable
              records passed the most recent SHA-256 integrity sweep, and the medication
              administration rate for the past 7 days is <strong>98.6%</strong>.
            </p>
            <p>
              128 residents are in care across three wings, supported by 42 registered staff. Care
              plans are current for 96% of residents, with two due for periodic review this week.
              The audit ledger has been sealed nightly with zero mismatches over the last 30 days.
            </p>
            <p>
              Three low-to-high severity risks are actively managed with assigned staff and target
              resolution dates below the CQC recommended cadence. No safeguarding alerts are open.
            </p>
            <div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommendations
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Complete Beatrice Coleman's end-of-life care review by 10 July.</li>
                <li>Confirm secondary NOK for Room 118 during this week's family calls.</li>
                <li>Review 14:00 handover staffing to reduce late-dose incidents.</li>
              </ul>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Statistics
              </p>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt>Residents</dt>
                  <dd>128</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Care staff</dt>
                  <dd>42</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Records verified</dt>
                  <dd>18,204</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Failed integrity</dt>
                  <dd>0</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Medication compliance</dt>
                  <dd>98.6%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Open incidents</dt>
                  <dd>3</dd>
                </div>
              </dl>
            </div>

            <label className="block rounded-xl border border-border p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Inspection notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspector's notes will be printed with this report…"
                className="mt-2 min-h-[80px] w-full resize-y rounded-md border border-border bg-card px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/20"
              />
            </label>

            <div className="rounded-xl border border-dashed border-border p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Signature className="h-3.5 w-3.5" /> Manager signature
              </div>
              <div className="mt-3 h-16 rounded-md bg-secondary/50" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Ella Morgan · Home Manager · {new Date().toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
