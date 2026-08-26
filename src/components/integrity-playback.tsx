import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShieldCheck,
  Hash,
  Clock,
  User,
  Wifi,
  Monitor,
  GitCommit,
  ChevronDown,
  CheckCircle2,
  History,
  FileText,
} from "lucide-react";
import { Card, Badge } from "./ui-kit";
import { fakeSha256, shortHash } from "@/lib/hash";
import { BtnGhost, BtnPrimary } from "./modal";
import { useIntegrityHistory } from "@/hooks/use-integrity";

// export type PlaybackVersion = {
//   v: number;
//   action: string;
//   time: string;
//   user: string;
//   fields: { name: string; before: string; after: string }[];
//   oldHash: string;
//   newHash: string;
//   verified: "verified" | "warning" | "failed";
//   ip: string;
//   device: string;
//   comment?: string;
// };

type PlaybackVersion = {
  v: number;
  time: string;
  user: string;
  action: string;
  oldHash: string;
  newHash: string;
  verified: "verified" | "warning" | "failed";
  fields?: PlaybackField[];
  ip?: string | null;
  device?: string | null;
  comment?: string | null;
};

function generateVersions(recordId: string, title: string): PlaybackVersion[] {
  const seed = recordId + title;
  const now = new Date();
  const mk = (offset: number) =>
    new Date(now.getTime() - offset * 24 * 3600 * 1000).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const h = (i: number) => fakeSha256(seed + ":v" + i);
  const users = ["Ella Morgan", "James Owusu", "Priya Shah", "System sweep"];
  const devices = ["MacBook Pro · Safari", "iPad · Care app", "Windows · Chrome", "Server · cron"];
  const ips = ["10.0.4.02", "10.0.4.12", "10.0.4.28", "internal"];
  const timeline = [
    { action: `Record created`, fields: [{ name: "status", before: "—", after: "Active" }] },
    {
      action: `Care plan updated`,
      fields: [
        { name: "priority", before: "Routine", after: "Elevated" },
        { name: "notes", before: "Stable observations", after: "Increased mobility support" },
      ],
    },
    {
      action: `Medication added`,
      fields: [{ name: "medication", before: "—", after: "Ramipril 5mg · Oral · 08:00" }],
    },
    {
      action: `Nightly SHA-256 sweep`,
      fields: [{ name: "integrity", before: "verified", after: "verified" }],
    },
    {
      action: `Vital signs signed`,
      fields: [{ name: "vitals", before: "128/82 · 72bpm", after: "124/80 · 70bpm · SpO₂ 98%" }],
    },
  ];
  return timeline.map((t, i) => ({
    v: i + 1,
    action: t.action,
    time: mk(timeline.length - i - 1),
    user: users[i % users.length],
    fields: t.fields,
    oldHash: i === 0 ? "—" : h(i - 1),
    newHash: h(i),
    verified: "verified" as const,
    ip: ips[i % ips.length],
    device: devices[i % devices.length],
    comment: i === 1 ? "Reviewed with GP at weekly clinical round." : undefined,
  }));
}

// export function IntegrityPlaybackModal({
//   open,
//   onClose,
//   recordId,
//   recordTitle,
//   entityType = "CareRecord",
// }: {
//   open: boolean;
//   onClose: () => void;
//   recordId: string;
//   recordTitle: string;
//   entityType?: string;
// }) {
//   const { data: versions = [], isLoading } = useIntegrityHistory(
//     entityType,
//     recordId,
//     open, // only fetch when modal is open
//   );

//   console.log({ versions });

//   // const versions = useMemo(() => generateVersions(recordId, recordTitle), [recordId, recordTitle]);
//   const [current, setCurrent] = useState(0);
//   const [playing, setPlaying] = useState(false);
//   const [speed, setSpeed] = useState(1);
//   const [compare, setCompare] = useState<[number, number] | null>(null);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!open) return;
//     setCurrent(0);
//     setPlaying(false);
//     setCompare(null);
//   }, [open, recordId]);

//   useEffect(() => {
//     if (!playing) return;
//     const iv = setInterval(() => {
//       setCurrent((c) => {
//         if (c >= versions.length - 1) {
//           setPlaying(false);
//           return c;
//         }
//         return c + 1;
//       });
//     }, 1400 / speed);
//     return () => clearInterval(iv);
//   }, [playing, speed, versions.length]);

//   useEffect(() => {
//     const el = scrollRef.current?.querySelector<HTMLElement>(`[data-v="${current}"]`);
//     el?.scrollIntoView({ behavior: "smooth", block: "center" });
//   }, [current]);

//   if (!open) return null;

//   const version = versions[current];
//   const allVerified = versions.every((v) => v.verified === "verified");
//   const single = versions.length === 1;

//   return (
//     <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
//       {/* Header */}
//     </div>
//   );
// }

// export function ReplayHistoryButton({
//   recordId,
//   recordTitle,
//   variant = "outline",
// }: {
//   recordId: string;
//   recordTitle: string;
//   variant?: "outline" | "icon" | "ghost";
// }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <>
//       {variant === "icon" ? (
//         <button
//           onClick={() => setOpen(true)}
//           title="Replay Record History"
//           className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
//         >
//           <History className="h-4 w-4" />
//         </button>
//       ) : variant === "ghost" ? (
//         <button
//           onClick={() => setOpen(true)}
//           className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
//         >
//           <History className="h-3.5 w-3.5" /> Replay history
//         </button>
//       ) : (
//         <button
//           onClick={() => setOpen(true)}
//           className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
//         >
//           <History className="h-3.5 w-3.5" /> Replay Record History
//         </button>
//       )}
//       <IntegrityPlaybackModal
//         open={open}
//         onClose={() => setOpen(false)}
//         recordId={recordId}
//         recordTitle={recordTitle}
//       />
//     </>
//   );
// }

type PlaybackField = {
  name: string;
  before: string;
  after: string;
};

// function shortHash(hash?: string | null) {
//   if (!hash || hash === "—") return "—";
//   if (hash.length <= 12) return hash;
//   return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
// }

function formatTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB");
}

export function IntegrityPlaybackModal({
  open,
  onClose,
  recordId,
  recordTitle,
  entityType = "CareRecord",
}: {
  open: boolean;
  onClose: () => void;
  recordId: string;
  recordTitle: string;
  entityType?: string;
}) {
  const { data, isLoading } = useIntegrityHistory(entityType, recordId, open);
  const versions = (data ?? []) as PlaybackVersion[];

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [compare, setCompare] = useState<[number, number] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setCurrent(0);
    setPlaying(false);
    setCompare(null);
  }, [open, recordId, entityType]);

  useEffect(() => {
    if (!playing || versions.length === 0) return;
    const iv = setInterval(() => {
      setCurrent((c) => {
        if (c >= versions.length - 1) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 1400 / speed);
    return () => clearInterval(iv);
  }, [playing, speed, versions.length]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-v="${current}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);

  if (!open) return null;

  // ── Loading state ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Integrity Playback</p>
              <p className="text-xs text-muted-foreground">
                Loading history for{" "}
                <span className="font-medium text-foreground">{recordTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading integrity history…</p>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────
  if (!versions.length) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Integrity Playback</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{recordTitle}</span> · {recordId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold">No integrity history</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            No hashed versions were found for this {entityType}. Create or update the record to
            generate an integrity chain.
          </p>
          <BtnPrimary onClick={onClose}>Close</BtnPrimary>
        </div>
      </div>
    );
  }

  // ── Safe data access ───────────────────────────────────────────
  const safeIndex = Math.min(current, versions.length - 1);
  const version = versions[safeIndex] as PlaybackVersion;
  const fields = version.fields ?? [];
  const allVerified = versions.every((v) => v.verified === "verified");
  const single = versions.length === 1;
  const statusTone =
    version.verified === "verified"
      ? ("success" as const)
      : version.verified === "failed"
        ? ("critical" as const)
        : ("warning" as const);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Integrity Playback</p>
            <p className="text-xs text-muted-foreground">
              Complete historical evolution of{" "}
              <span className="font-medium text-foreground">{recordTitle}</span> · {recordId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={allVerified ? "success" : "critical"}>
            <ShieldCheck className="h-3 w-3" />
            {allVerified ? "100% Integrity Maintained" : "Integrity Failure"}
          </Badge>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline column */}
        <div ref={scrollRef} className="w-full max-w-md overflow-y-auto border-r border-border p-6">
          {single ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold">Single version</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This record has not been modified since creation.
              </p>
              <code className="mt-3 inline-block break-all rounded bg-secondary px-2 py-1 font-mono text-[11px]">
                {versions[0].newHash}
              </code>
            </div>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-success/40 pl-6">
              {versions.map((v, i) => {
                const active = i === safeIndex;
                const isLast = i === versions.length - 1;
                return (
                  <li key={`${v.v}-${i}`} data-v={i} className="relative">
                    <span
                      className={
                        "absolute -left-[29px] top-1 grid h-4 w-4 place-items-center rounded-full ring-4 ring-background transition " +
                        (v.verified === "verified"
                          ? "bg-success"
                          : v.verified === "warning"
                            ? "bg-warning"
                            : "bg-critical") +
                        (active ? " scale-125 shadow-lg" : "")
                      }
                    />
                    <button
                      onClick={() => setCurrent(i)}
                      className={
                        "w-full rounded-xl border p-3 text-left transition " +
                        (active
                          ? "border-primary bg-primary-soft shadow-elegant"
                          : "border-border bg-card hover:border-primary/40")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge tone={active ? "info" : "neutral"}>
                            v{v.v}
                            {isLast ? " · Current" : ""}
                          </Badge>
                          <ShieldCheck
                            className={
                              "h-3.5 w-3.5 " +
                              (v.verified === "verified"
                                ? "text-success"
                                : v.verified === "failed"
                                  ? "text-critical"
                                  : "text-warning")
                            }
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(v.time)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{v.action}</p>
                      <p className="text-xs text-muted-foreground">by {v.user}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px]">
                        <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">
                          {shortHash(v.newHash)}
                        </code>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Detail column */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Version {version.v} of {versions.length}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{version.action}</h3>
                  <p className="text-xs text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" /> {formatTime(version.time)} ·{" "}
                    {version.user}
                  </p>
                </div>
                <Badge tone={statusTone}>
                  <ShieldCheck className="h-3 w-3" />
                  {version.verified === "verified"
                    ? "Verified"
                    : version.verified === "failed"
                      ? "Failed"
                      : "Warning"}
                </Badge>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Field-level changes
                </p>
                {fields.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No field-level diff available for this version.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {fields.map((f) => (
                      <li key={f.name} className="rounded-xl border border-border p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {f.name}
                        </p>
                        <div className="mt-1 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-critical-soft p-2 text-xs">
                            <span className="text-critical">− previous</span>
                            <p className="mt-0.5 font-medium">{f.before}</p>
                          </div>
                          <div className="rounded-lg bg-success-soft p-2 text-xs">
                            <span className="text-success">+ updated</span>
                            <p className="mt-0.5 font-medium">{f.after}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Previous SHA-256
                  </p>
                  <code className="mt-1 block break-all font-mono text-[11px]">
                    {version.oldHash || "—"}
                  </code>
                </div>
                <div className="rounded-xl border border-primary/40 bg-primary-soft p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    New SHA-256
                  </p>
                  <code className="mt-1 block break-all font-mono text-[11px]">
                    {version.newHash || "—"}
                  </code>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                <span className="flex items-center gap-1.5">
                  <Wifi className="h-3 w-3" /> {version.ip || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Monitor className="h-3 w-3" /> {version.device || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> SHA-256
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3 w-3" /> {version.user}
                </span>
              </div>

              {version.comment && (
                <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Comment
                  </p>
                  <p className="mt-1">{version.comment}</p>
                </div>
              )}
            </Card>

            {/* Integrity status card */}
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Integrity status
              </p>
              <div
                className={
                  "mt-3 rounded-2xl border p-5 text-center " +
                  (version.verified === "verified"
                    ? "border-success/30 bg-success-soft"
                    : version.verified === "failed"
                      ? "border-critical/30 bg-critical-soft"
                      : "border-warning/30 bg-warning-soft")
                }
              >
                <div
                  className={
                    "mx-auto grid h-14 w-14 place-items-center rounded-full " +
                    (version.verified === "verified"
                      ? "bg-success text-success-foreground"
                      : version.verified === "failed"
                        ? "bg-critical text-critical-foreground"
                        : "bg-warning text-warning-foreground")
                  }
                >
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p
                  className={
                    "mt-3 text-sm font-semibold " +
                    (version.verified === "verified"
                      ? "text-success"
                      : version.verified === "failed"
                        ? "text-critical"
                        : "text-warning")
                  }
                >
                  {version.verified === "verified"
                    ? "Verified"
                    : version.verified === "failed"
                      ? "Failed"
                      : "Warning"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {version.verified === "verified"
                    ? "Hash matches ledger byte-for-byte"
                    : "Hash does not match stored ledger value"}
                </p>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Algorithm</dt>
                  <dd className="font-medium">SHA-256</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Verified at</dt>
                  <dd>{formatTime(version.time)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Method</dt>
                  <dd>Ledger comparison</dd>
                </div>
              </dl>
            </Card>
          </div>

          {/* Hash chain */}
          <Card className="mt-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Hash-chain evolution</h4>
                <p className="text-xs text-muted-foreground">
                  Every version cryptographically links to the previous.
                </p>
              </div>
              <Badge tone={allVerified ? "success" : "critical"}>
                <GitCommit className="h-3 w-3" /> {versions.length} links ·{" "}
                {allVerified ? "intact" : "issues found"}
              </Badge>
            </div>
            <div className="mt-4 flex items-stretch gap-2 overflow-x-auto pb-2">
              {versions.map((v, i) => (
                <div key={`${v.v}-chain-${i}`} className="flex items-center">
                  <button
                    onClick={() => setCurrent(i)}
                    className={
                      "min-w-[168px] rounded-xl border p-3 text-left transition " +
                      (i === safeIndex
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-card hover:border-primary/40")
                    }
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Version {v.v}
                    </p>
                    <code className="mt-1 block font-mono text-[11px]">{shortHash(v.newHash)}</code>
                    <p className="mt-1 text-[10px] text-muted-foreground">{v.action}</p>
                  </button>
                  {i < versions.length - 1 && (
                    <ChevronDown className="mx-1 h-4 w-4 shrink-0 -rotate-90 text-success" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Compare versions */}
          {!single && (
            <Card className="mt-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold">Compare versions</h4>
                  <p className="text-xs text-muted-foreground">
                    Select two versions to diff side-by-side.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    className="h-8 rounded-lg border border-border bg-card px-2"
                    value={compare?.[0] ?? 0}
                    onChange={(e) =>
                      setCompare([Number(e.target.value), compare?.[1] ?? versions.length - 1])
                    }
                  >
                    {versions.map((v, i) => (
                      <option key={i} value={i}>
                        v{v.v} · {v.action}
                      </option>
                    ))}
                  </select>
                  <span>vs</span>
                  <select
                    className="h-8 rounded-lg border border-border bg-card px-2"
                    value={compare?.[1] ?? versions.length - 1}
                    onChange={(e) => setCompare([compare?.[0] ?? 0, Number(e.target.value)])}
                  >
                    {versions.map((v, i) => (
                      <option key={i} value={i}>
                        v{v.v} · {v.action}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {compare && versions[compare[0]] && versions[compare[1]] && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[versions[compare[0]], versions[compare[1]]].map((v, idx) => (
                    <div key={idx} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <Badge tone="info">v{v.v}</Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(v.time)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{v.action}</p>
                      <code className="mt-2 block break-all rounded bg-secondary px-1.5 py-1 font-mono text-[11px]">
                        {v.newHash}
                      </code>
                      <ul className="mt-2 space-y-1 text-xs">
                        {(v.fields ?? []).map((f: PlaybackField) => (
                          <li key={f.name}>
                            <span className="text-muted-foreground">{f.name}:</span>{" "}
                            <span className="font-medium">{f.after}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {allVerified && !single && (
            <Card className="mt-4 border-success/30 bg-success-soft p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-success-foreground">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <p className="mt-3 text-lg font-semibold text-success">
                Every version successfully verified
              </p>
              <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
                All {versions.length} versions of this record have passed integrity verification. No
                unauthorized modifications were detected.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Playback controls */}
      {!single && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-6 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrent(0)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent(Math.max(0, safeIndex - 1))}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Previous"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => setCurrent(Math.min(versions.length - 1, safeIndex + 1))}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Next"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent(versions.length - 1)}
              className="ml-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-secondary"
            >
              Jump to current
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">Speed</span>
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={
                  "rounded-md px-2 py-1 text-[11px] font-semibold " +
                  (speed === s
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-secondary")
                }
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center gap-3 md:max-w-md">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                style={{ width: `${((safeIndex + 1) / versions.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              v{version.v} / {versions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <BtnGhost onClick={onClose}>Close</BtnGhost>
            <BtnPrimary onClick={onClose}>Done</BtnPrimary>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReplayHistoryButton({
  recordId,
  recordTitle,
  entityType = "CareRecord",
  variant = "outline",
}: {
  recordId: string;
  recordTitle: string;
  entityType?: string;
  variant?: "outline" | "icon" | "ghost";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          title="Replay Record History"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
        >
          <History className="h-4 w-4" />
        </button>
      ) : variant === "ghost" ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <History className="h-3.5 w-3.5" /> Replay history
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-secondary"
        >
          <History className="h-3.5 w-3.5" /> Replay Record History
        </button>
      )}

      <IntegrityPlaybackModal
        open={open}
        onClose={() => setOpen(false)}
        recordId={recordId}
        recordTitle={recordTitle}
        entityType={entityType}
      />
    </>
  );
}
