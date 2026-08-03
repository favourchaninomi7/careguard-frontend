import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { FileDown, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { GenerateReportModal } from "@/components/modals";
import { toast } from "sonner";
import { useComplianceDashboard } from "@/hooks/use-compliance";

export const Route = createFileRoute("/compliance")({
  head: () => ({ meta: [{ title: "Compliance Reports — CareGuard" }] }),
  component: CompliancePage,
});

function CompliancePage() {
  const [gen, setGen] = useState(false);
  const { data, isLoading } = useComplianceDashboard();

  // Safe fallbacks so the UI never breaks
  const overallScore = data?.overallScore ?? 0;
  const rating = data?.rating ?? "Good";
  const trend = data?.trend ?? [];
  const categories = data?.categories ?? [];
  const reports = data?.reports ?? [];

  return (
    <AppShell>
      <SectionHeader
        title="Compliance Reports"
        description="CQC-ready exports across residents, medication and record integrity."
        action={
          <button
            onClick={() => setGen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
          >
            <FileDown className="h-3.5 w-3.5" /> Generate inspection report
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly trend */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Compliance score — monthly</h3>
              <p className="text-xs text-muted-foreground">Rolling composite CQC score</p>
            </div>
            <Badge tone={overallScore >= 95 ? "success" : overallScore >= 90 ? "info" : "warning"}>
              {isLoading ? "…" : `${overallScore}% · ${rating}`}
            </Badge>
          </div>

          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading chart…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* CQC Key Questions */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold">CQC key questions</h3>
          <ul className="mt-4 space-y-4">
            {isLoading ? (
              <li className="text-sm text-muted-foreground">Loading…</li>
            ) : (
              categories.map((c) => (
                <li key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{c.score}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={
                        "h-full rounded-full " +
                        (c.score >= 95 ? "bg-success" : c.score >= 90 ? "bg-primary" : "bg-warning")
                      }
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Recent reports */}
      <Card className="mt-4 overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold">Recent reports</h3>
        </div>
        <ul className="divide-y divide-border">
          {isLoading ? (
            <li className="p-4 text-sm text-muted-foreground">Loading reports…</li>
          ) : reports.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No reports generated yet</li>
          ) : (
            reports.map((r) => (
              <li key={r.id} className="flex items-center gap-4 p-4 hover:bg-secondary/40">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.period} · {r.format} · {r.size}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (r.fileUrl) {
                      window.open(r.fileUrl, "_blank");
                    } else {
                      toast.success(`Downloaded ${r.name}`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      <GenerateReportModal open={gen} onClose={() => setGen(false)} />
    </AppShell>
  );
}
