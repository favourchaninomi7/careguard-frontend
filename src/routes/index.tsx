import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  AddResidentModal,
  RecordMedicationModal,
  VerifyAllExperience,
  GenerateReportModal,
} from "@/components/modals";
import { Card, Badge, Dot } from "@/components/ui-kit";
import {
  Users,
  UserCog,
  ShieldCheck,
  FileCheck2,
  Clock3,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Pill,
  ScrollText,
  FileDown,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareGuard" },
      {
        name: "description",
        content:
          "Overview of compliance score, resident status, medication adherence and record integrity.",
      },
    ],
  }),
  component: DashboardPage,
});

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: 12,
    boxShadow: "0 8px 24px -12px rgb(15 23 42 / 0.15)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 500 },
};

const iconMap: Record<string, any> = {
  Users,
  UserCog,
  ShieldCheck,
  FileCheck2,
  Clock3,
  AlertTriangle,
  Pill,
  ScrollText,
  Activity,
};

function DashboardPage() {
  const [addRes, setAddRes] = useState(false);
  const [addMed, setAddMed] = useState(false);
  const [verify, setVerify] = useState(false);
  const [report, setReport] = useState(false);

  const { data, isLoading } = useDashboard();

  const { user } = useAuthStore();

  console.log({ user });

  // Safe fallbacks
  const greetingName = user?.firstName ?? data?.greetingName ?? "there";
  const careHomeName = data?.careHomeName ?? "Care Home";
  const totalResidents = data?.totalResidents ?? 0;

  const kpis = data?.kpis ?? [];
  const complianceTrend = data?.complianceTrend ?? [];
  const integrityData = data?.integrityData ?? [];
  const medsData = data?.medsData ?? [];
  const activity = data?.activity ?? [];
  const alerts = data?.alerts ?? [];
  const reviews = data?.reviews ?? [];
  const auditLog = data?.auditLog ?? [];
  const complianceScore = data?.complianceScore ?? 0;
  const complianceRating = data?.complianceRating ?? "Good";
  const cqc = data?.cqcBreakdown ?? { safe: 0, effective: 0, wellLed: 0 };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Compliance overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Good morning, {greetingName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {careHomeName} · Registered with CQC · {totalResidents} residents in care
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddRes(true)}
            data-inspection-hide
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resident
          </button>
          <button
            onClick={() => setAddMed(true)}
            data-inspection-hide
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Pill className="h-3.5 w-3.5" /> Record Medication
          </button>
          <button
            onClick={() => setVerify(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Verify Records
          </button>
          <button
            onClick={() => setReport(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <FileDown className="h-3.5 w-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 h-28 animate-pulse bg-secondary/40">
                <span></span>
              </Card>
            ))
          : kpis.map((k: any) => {
              const Icon =
                iconMap[
                  k.label.includes("Resident")
                    ? "Users"
                    : k.label.includes("Staff")
                      ? "UserCog"
                      : k.label.includes("Compliance")
                        ? "ShieldCheck"
                        : k.label.includes("Verified")
                          ? "FileCheck2"
                          : k.label.includes("Pending")
                            ? "Clock3"
                            : "AlertTriangle"
                ];
              const up = k.trend === "up";
              const good =
                k.label === "Pending Reviews" || k.label === "Integrity Alerts" ? !up : up;

              return (
                <Card key={k.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={
                        "inline-flex items-center gap-0.5 text-[11px] font-semibold " +
                        (good ? "text-success" : "text-critical")
                      }
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {k.delta}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{k.label}</p>
                  <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                    {k.value}
                  </p>
                </Card>
              );
            })}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Compliance trend</h3>
              <p className="text-xs text-muted-foreground">Rolling 9-month CQC score</p>
            </div>
            <Badge tone="success">Live</Badge>
          </div>
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={complianceTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="m"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    domain={[85, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#g1)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Compliance score</h3>
            <Badge tone={complianceScore >= 95 ? "success" : "info"}>{complianceRating}</Badge>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <Gauge value={complianceScore} />
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Above CQC "Good" threshold (85%). Next inspection window opens in 12 days.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Safe</p>
              <p className="text-sm font-semibold">{cqc.safe}%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Effective</p>
              <p className="text-sm font-semibold">{cqc.effective}%</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Well-led</p>
              <p className="text-sm font-semibold">{cqc.wellLed}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrity + Medication charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Integrity verification</h3>
              <p className="text-xs text-muted-foreground">SHA-256 hash checks this week</p>
            </div>
            <Badge tone="info">Live</Badge>
          </div>
          <div className="mt-4 h-56">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={integrityData}
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
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="verified" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="failed" fill="var(--critical)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Medication compliance</h3>
              <p className="text-xs text-muted-foreground">On-time administration rate</p>
            </div>
            <Badge tone="success">Live</Badge>
          </div>
          <div className="mt-4 h-56">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={medsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    stroke="var(--success)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--success)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Activity + Alerts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <button className="text-xs font-semibold text-primary hover:underline">View all</button>
          </div>
          <ul className="mt-4 space-y-3">
            {isLoading ? (
              <li className="text-sm text-muted-foreground">Loading activity…</li>
            ) : activity.length === 0 ? (
              <li className="text-sm text-muted-foreground">No recent activity</li>
            ) : (
              activity.map((a: any, i: number) => {
                const Icon = iconMap[a.icon] || FileCheck2;
                const toneBg: Record<string, string> = {
                  success: "bg-success-soft text-success",
                  info: "bg-primary-soft text-primary",
                  critical: "bg-critical-soft text-critical",
                  neutral: "bg-secondary text-secondary-foreground",
                };
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border hover:bg-secondary/50"
                  >
                    <div
                      className={
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg " + toneBg[a.tone]
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.meta}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
                  </li>
                );
              })
            )}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Integrity alerts</h3>
              <Badge tone="critical">
                {alerts.filter((a: any) => a.severity === "critical").length} critical
              </Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {alerts.length === 0 ? (
                <li className="text-sm text-muted-foreground">No alerts</li>
              ) : (
                alerts.map((a: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border p-3"
                  >
                    <Dot tone={a.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.record}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{a.time}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold">System status</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Verification engine
                </span>
                <Badge tone="success">Operational</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Audit ledger
                </span>
                <Badge tone="success">Sealed</Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Backup replica
                </span>
                <Badge tone="success">Synced</Badge>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Reviews + Audit log */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Upcoming resident reviews</h3>
            <button className="text-xs font-semibold text-primary hover:underline">Schedule</button>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {reviews.length === 0 ? (
              <li className="py-3 text-sm text-muted-foreground">No upcoming reviews</li>
            ) : (
              reviews.map((r: any) => (
                <li key={r.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                      {r.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Room {r.room}</p>
                    </div>
                  </div>
                  <Badge tone={r.tone}>{r.due}</Badge>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent audit logs</h3>
            <button className="text-xs font-semibold text-primary hover:underline">
              Open ledger
            </button>
          </div>
          <ul className="mt-3 space-y-3">
            {auditLog.length === 0 ? (
              <li className="text-sm text-muted-foreground">No recent logs</li>
            ) : (
              auditLog.map((l: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{l.user}</span>{" "}
                      <span className="text-muted-foreground">{l.action}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{l.time}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Modals */}
      <AddResidentModal open={addRes} onClose={() => setAddRes(false)} resident={null} />
      <RecordMedicationModal open={addMed} onClose={() => setAddMed(false)} />
      <VerifyAllExperience open={verify} onClose={() => setVerify(false)} />
      <GenerateReportModal open={report} onClose={() => setReport(false)} />
    </AppShell>
  );
}

function Gauge({ value }: { value: number }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--success)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-tight">{value}%</p>
          <p className="text-[11px] text-muted-foreground">CQC score</p>
        </div>
      </div>
    </div>
  );
}
