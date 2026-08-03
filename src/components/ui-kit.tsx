import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-border bg-card shadow-card " + className
      }
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

type BadgeTone =
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "neutral";

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const map: Record<BadgeTone, string> = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
    critical: "bg-critical-soft text-critical",
    info: "bg-primary-soft text-primary",
    neutral: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
        map[tone] +
        " " +
        className
      }
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: BadgeTone }) {
  const map: Record<BadgeTone, string> = {
    success: "bg-success",
    warning: "bg-warning",
    critical: "bg-critical",
    info: "bg-primary",
    neutral: "bg-muted-foreground",
  };
  return <span className={"h-1.5 w-1.5 rounded-full " + map[tone]} />;
}
