import { useEffect, useState } from "react";
import { ShieldCheck, LogOut, Clock, User, Hash, Radio } from "lucide-react";
import { useInspection } from "@/lib/inspection";
import { Modal, BtnGhost, BtnPrimary } from "./modal";

export function InspectionStyle() {
  return (
    <style>{`
      body.inspection-mode [data-inspection-hide]{display:none!important}
      body.inspection-mode [data-inspection-lock] input:not([type="search"]),
      body.inspection-mode [data-inspection-lock] select,
      body.inspection-mode [data-inspection-lock] textarea{pointer-events:none;opacity:.7}
    `}</style>
  );
}

export function StartInspectionButton() {
  const { active, activate, deactivate } = useInspection();
  const [confirm, setConfirm] = useState<"enter" | "exit" | null>(null);

  return (
    <>
      {!active ? (
        <button
          onClick={() => setConfirm("enter")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Start Inspection Mode
        </button>
      ) : (
        <button
          onClick={() => setConfirm("exit")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-critical/30 bg-critical-soft px-3 py-2 text-xs font-semibold text-critical transition hover:bg-critical/15"
        >
          <LogOut className="h-3.5 w-3.5" /> Exit Inspection Mode
        </button>
      )}

      <Modal
        open={confirm === "enter"}
        onClose={() => setConfirm(null)}
        title="Enter CQC Inspection Mode"
        description="Read-only environment for regulatory reviews."
        size="md"
        footer={
          <>
            <BtnGhost onClick={() => setConfirm(null)}>Cancel</BtnGhost>
            <BtnPrimary
              onClick={() => {
                activate();
                setConfirm(null);
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Enter Inspection Mode
            </BtnPrimary>
          </>
        }
      >
        <div className="rounded-xl border border-primary/30 bg-primary-soft p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-foreground">
              You are about to enter a read-only inspection environment designed for regulatory
              reviews. Editing functions will be temporarily hidden until Inspection Mode is exited.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirm === "exit"}
        onClose={() => setConfirm(null)}
        title="Exit Inspection Mode?"
        size="sm"
        footer={
          <>
            <BtnGhost onClick={() => setConfirm(null)}>Stay</BtnGhost>
            <BtnPrimary
              onClick={() => {
                deactivate();
                setConfirm(null);
              }}
            >
              Exit
            </BtnPrimary>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Return to the standard operational interface? All editing functions will be restored and
          the current inspection session will end.
        </p>
      </Modal>
    </>
  );
}

export function InspectionBanner() {
  const { active, sessionId, activatedAt, deactivate } = useInspection();
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, [active]);

  if (!active) return null;

  const duration = activatedAt
    ? Math.max(0, Math.floor((now.getTime() - activatedAt.getTime()) / 1000))
    : 0;
  const mm = String(Math.floor(duration / 60)).padStart(2, "0");
  const ss = String(duration % 60).padStart(2, "0");

  return (
    <div className="border-b border-primary/30 bg-gradient-to-r from-primary/10 via-primary-soft to-primary/10">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-xs md:px-6">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Radio className="h-3.5 w-3.5" />
          Inspection Mode Active
        </div>
        <span className="hidden items-center gap-1.5 text-muted-foreground md:inline-flex">
          <Clock className="h-3.5 w-3.5" />
          {now.toLocaleString("en-GB")} · {mm}:{ss}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Hash className="h-3.5 w-3.5" />
          <span className="font-mono">{sessionId}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3.5 w-3.5" /> Ella Morgan · Home Manager
        </span>
        <span className="hidden text-muted-foreground lg:inline">
          Last verification 12 min ago · 18,204/18,204 records verified
        </span>
        <button
          onClick={deactivate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-critical/30 bg-critical-soft px-2.5 py-1 font-semibold text-critical hover:bg-critical/15"
        >
          <LogOut className="h-3.5 w-3.5" /> Exit Inspection Mode
        </button>
      </div>
    </div>
  );
}
