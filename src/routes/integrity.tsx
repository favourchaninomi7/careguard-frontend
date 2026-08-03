import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { ShieldCheck, ShieldAlert, ShieldX, RefreshCw, Play } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { VerifyAllExperience } from "@/components/modals";
import { toast } from "sonner";
import { useIntegrityDashboard } from "@/hooks/use-integrity";

export const Route = createFileRoute("/integrity")({
  head: () => ({ meta: [{ title: "Integrity Verification — CareGuard" }] }),
  component: IntegrityPage,
});

const tone = (s: string) =>
  s === "Verified"
    ? ("success" as const)
    : s === "Integrity failed"
      ? ("critical" as const)
      : s === "Warning"
        ? ("warning" as const)
        : ("info" as const);

function IntegrityPage() {
  const [verify, setVerify] = useState(false);
  const { data, isLoading, isError, refetch } = useIntegrityDashboard();

  // Fallbacks so the UI never breaks
  const stats = data?.stats ?? {
    recordsVerified: 0,
    successRate: 100,
    modifiedRecords: 0,
    failedVerification: 0,
  };

  const trend = data?.trend ?? [];
  const alerts = data?.alerts ?? [];
  const queue = data?.queue ?? [];

  const formatNumber = (n: number) => n.toLocaleString("en-GB");

  return (
    <AppShell>
      <SectionHeader
        title="Integrity Verification"
        description="Continuous SHA-256 verification across every care and medication record."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.success("Requeued failed records for verification");
                refetch();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Rerun failed
            </button>
            <button
              onClick={() => setVerify(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
            >
              <Play className="h-3.5 w-3.5" /> Verify all records
            </button>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          {
            l: "Records verified",
            v: formatNumber(stats.recordsVerified),
            tone: "info" as const,
            icon: ShieldCheck,
          },
          {
            l: "Success rate",
            v: `${stats.successRate}%`,
            tone: "success" as const,
            icon: ShieldCheck,
          },
          {
            l: "Modified records",
            v: formatNumber(stats.modifiedRecords),
            tone: "warning" as const,
            icon: ShieldAlert,
          },
          {
            l: "Failed verification",
            v: formatNumber(stats.failedVerification),
            tone: "critical" as const,
            icon: ShieldX,
          },
        ].map((s) => {
          const Icon = s.icon;
          const toneBg: Record<string, string> = {
            info: "bg-primary-soft text-primary",
            success: "bg-success-soft text-success",
            warning: "bg-warning-soft text-warning-foreground",
            critical: "bg-critical-soft text-critical",
          };
          return (
            <Card key={s.l} className="p-4">
              <div className={"grid h-10 w-10 place-items-center rounded-lg " + toneBg[s.tone]}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{s.l}</p>
              <p className="text-2xl font-semibold">{isLoading ? "—" : s.v}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Verification history</h3>
              <p className="text-xs text-muted-foreground">
                Last 14 days · Verified vs. failed checks
              </p>
            </div>
            <Badge tone={stats.failedVerification === 0 ? "success" : "warning"}>
              {stats.failedVerification === 0 ? "All clear" : "Issues detected"}
            </Badge>
          </div>

          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="verified"
                    stroke="var(--primary)"
                    fill="url(#v)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="var(--critical)"
                    fill="url(#f)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">Recent integrity alerts</h3>
          <ul className="mt-3 space-y-3">
            {isLoading ? (
              <li className="text-sm text-muted-foreground">Loading alerts…</li>
            ) : alerts.length === 0 ? (
              <li className="text-sm text-muted-foreground">No recent alerts</li>
            ) : (
              alerts.map((a, i) => (
                <li key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={
                        "mt-1 h-2 w-2 shrink-0 rounded-full " +
                        (a.severity === "critical" ? "bg-critical" : "bg-warning")
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.record}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {a.user} · {a.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Verification queue */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Verification queue</h3>
            <p className="text-xs text-muted-foreground">Most recent SHA-256 hash comparisons</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">SHA-256</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading verification queue…
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No records in the queue
                  </td>
                </tr>
              ) : (
                queue.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3 font-medium">{q.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.resident}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-secondary px-2 py-1 font-mono text-[11px]">
                        {q.hash}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone(q.status)}>{q.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <VerifyAllExperience open={verify} onClose={() => setVerify(false)} />
    </AppShell>
  );
}
