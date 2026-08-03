import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, FileCheck2, Activity, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CareGuard" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left illustration - unchanged */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(1 0 0 / 0.5), transparent 40%), radial-gradient(circle at 80% 60%, var(--success), transparent 45%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">CareGuard</p>
              <p className="text-xs text-white/70">Compliance Suite</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Every care record, cryptographically proven.
            </h1>
            <p className="mt-4 text-white/80">
              SHA-256 verified records, immutable audit trails and CQC-ready reports — built for UK
              residential care homes.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: Lock, label: "SHA-256 integrity on every save" },
                { icon: FileCheck2, label: "Immutable audit trail with hash chain" },
                { icon: Activity, label: "Real-time compliance monitoring" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/90">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">
            © 2026 CareGuard · Registered with the CQC · ISO 27001 accredited
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="font-semibold">CareGuard</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your care home credentials.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@carehome.co.uk"
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {/* <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-border" />
              Remember this device for 30 days
            </label> */}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in securely"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected by hardware-backed 2FA · Data hosted in the United Kingdom
          </p>
        </div>
      </div>
    </div>
  );
}
