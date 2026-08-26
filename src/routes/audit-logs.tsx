import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { Filter, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { ReplayHistoryButton } from "@/components/integrity-playback";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import type { AuditLogItem } from "@/services/audit-service";

export const Route = createFileRoute("/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — CareGuard" }] }),
  component: AuditPage,
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortHash(hash: string | null) {
  if (!hash) return "—";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
}

function recordLine(log: AuditLogItem) {
  const code = log.entityId || "—";
  const name = log.residentName;
  if (name) return `${code} · ${name}`;
  if (log.entityType) return `${log.entityType} · ${code}`;
  return code;
}

function getBadge(entry: {
  action?: string;
  actionLabel?: string;
  status?: string;
  statusLabel?: string;
}) {
  const action = (entry.actionLabel || entry.action || "").toLowerCase();
  const status = (entry.statusLabel || entry.status || "").toUpperCase();

  if (
    action.includes("mismatch") ||
    action.includes("integrity_failed") ||
    action.includes("failed") ||
    status === "FAILURE" ||
    status === "INTEGRITY FAILED"
  ) {
    return { label: "Failed", tone: "critical" as const };
  }

  if (
    action.includes("verified") ||
    action.includes("logged in") ||
    status === "SUCCESS" ||
    status === "VERIFIED"
  ) {
    return { label: "Verified", tone: "success" as const };
  }

  return {
    label: entry.statusLabel || entry.status || "Info",
    tone: "warning" as const,
  };
}

function AuditPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const [filters] = useState({});

  const query = useMemo(
    () => ({
      page,
      limit,
      ...filters,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, isFetching, isError } = useAuditLogs(query);

  const items = data?.items ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };

  // Group items by date (YYYY-MM-DD)
  const grouped = useMemo(() => {
    const map = new Map<string, AuditLogItem[]>();

    for (const item of items) {
      const key = new Date(item.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    // Sort dates descending (newest first)
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [items]);

  return (
    <AppShell>
      <SectionHeader
        title="Audit Logs"
        description="Immutable ledger of every change — old and new SHA-256 hashes preserved."
        action={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90">
              <Download className="h-3.5 w-3.5" /> Export ledger
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["Today", "User: All", "Resident: All", "Action: All"].map((f) => (
          <span
            key={f}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
          >
            {f}
          </span>
        ))}
      </div>

      <Card className="p-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading audit logs…</p>
        ) : isError ? (
          <p className="text-sm text-critical">Failed to load audit logs.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit logs found.</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([dateKey, logs]) => (
              <div key={dateKey}>
                {/* Date header */}
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {formatDateLabel(logs[0].timestamp)}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {logs.length} event{logs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Timeline for this date */}
                <ol className="relative space-y-5 border-l border-border pl-6">
                  {logs.map((e) => {
                    const badge = getBadge(e);
                    return (
                      <li key={e.id} className="relative">
                        <span
                          className={
                            "absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full ring-4 ring-card " +
                            (badge.tone === "success"
                              ? "bg-success"
                              : badge.tone === "critical"
                                ? "bg-critical"
                                : "bg-warning")
                          }
                        />
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {formatTime(e.timestamp)}
                          </span>
                          <p className="text-sm">
                            <span className="font-medium">{e.user?.name ?? "System"}</span>{" "}
                            <span className="text-muted-foreground">{e.actionLabel}</span>
                          </p>
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {recordLine(e)} · IP {e.ipAddress ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono">
                            old: {shortHash(e.oldHash)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono">
                            new: {shortHash(e.newHash)}
                          </span>
                          <ReplayHistoryButton
                            recordId={e.entityId}
                            recordTitle={recordLine(e)}
                            variant="ghost"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} events
              {isFetching && !isLoading ? " · refreshing…" : ""}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-secondary"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-secondary"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
