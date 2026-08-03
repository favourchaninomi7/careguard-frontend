import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, SectionHeader } from "@/components/ui-kit";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — CareGuard" }] }),
  component: SettingsPage,
});

function Row({ label, hint, control }: { label: string; hint: string; control: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {control}
    </div>
  );
}

function Toggle({ on = false }: { on?: boolean }) {
  return (
    <button
      className={
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
        (on ? "bg-primary" : "bg-secondary")
      }
    >
      <span
        className={
          "inline-block h-5 w-5 transform rounded-full bg-card shadow transition-transform " +
          (on ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

function SettingsPage() {
  return (
    <AppShell>
      <SectionHeader
        title="Settings"
        description="Manage organisation, verification and security preferences."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organisation</p>
            <p className="mt-2 text-base font-semibold">Elmwood Grove Care Home</p>
            <p className="text-xs text-muted-foreground">CQC-1-2345678910 · Registered manager: Ella Morgan</p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>128 residents · 42 staff</p>
              <p>Data region: United Kingdom (London)</p>
              <p>Retention: 8 years (CQC minimum)</p>
            </div>
          </Card>
        </div>

        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold">Integrity & security</h3>
          <div className="mt-2">
            <Row
              label="Automatic SHA-256 verification"
              hint="Run integrity checks on every record save and nightly sweep."
              control={<Toggle on />}
            />
            <Row
              label="Two-factor authentication"
              hint="Require 2FA for all staff accounts with clinical access."
              control={<Toggle on />}
            />
            <Row
              label="Immutable audit ledger"
              hint="Prevent deletion or amendment of audit trail events."
              control={<Toggle on />}
            />
            <Row
              label="Alert manager on integrity failure"
              hint="Send email and SMS to the on-duty manager within 60 seconds."
              control={<Toggle on />}
            />
            <Row
              label="Export watermarking"
              hint="Embed hash and inspector identifier in exported PDF reports."
              control={<Toggle />}
            />
          </div>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold">Compliance framework</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { l: "CQC Fundamental Standards", v: "Enabled" },
              { l: "GDPR / UK Data Protection Act", v: "Enabled" },
              { l: "NHS Data Security Toolkit", v: "Standards met" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{s.l}</p>
                <p className="mt-1 text-sm font-semibold text-success">{s.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
