import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InspectionCtx = {
  active: boolean;
  sessionId: string;
  activatedAt: Date | null;
  activate: () => void;
  deactivate: () => void;
};

const Ctx = createContext<InspectionCtx>({
  active: false,
  sessionId: "",
  activatedAt: null,
  activate: () => {},
  deactivate: () => {},
});

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [activatedAt, setActivatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("inspection-mode", active);
    return () => {
      document.body.classList.remove("inspection-mode");
    };
  }, [active]);

  const activate = () => {
    setSessionId("CQC-" + Math.random().toString(36).slice(2, 8).toUpperCase());
    setActivatedAt(new Date());
    setActive(true);
  };
  const deactivate = () => setActive(false);

  return (
    <Ctx.Provider value={{ active, sessionId, activatedAt, activate, deactivate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInspection() {
  return useContext(Ctx);
}
