import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  Pill,
  ShieldCheck,
  ScrollText,
  ClipboardCheck,
  UserCog,
  Settings,
  Search,
  Bell,
  Plus,
  ShieldHalf,
  Calendar,
  ChevronDown,
  Gavel,
  LogOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useInspection } from "@/lib/inspection";
import { InspectionBanner, StartInspectionButton } from "./inspection-banner";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@/store"; // ← new import
import { INSPECTION_MODE_ROLES, UserRole } from "@/services/user-service";

// const nav = [
//   { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
//   { to: "/residents", label: "Residents", icon: Users },
//   { to: "/care-records", label: "Care Records", icon: FileText },
//   { to: "/medication", label: "Medication Records", icon: Pill },
//   { to: "/integrity", label: "Integrity Verification", icon: ShieldCheck },
//   { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
//   { to: "/compliance", label: "Compliance Reports", icon: ClipboardCheck },
//   { to: "/users", label: "Users", icon: UserCog, editOnly: true },
//   { to: "/settings", label: "Settings", icon: Settings, editOnly: true },
// ];

const nav = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    roles: Object.values(UserRole),
  },
  {
    to: "/residents",
    label: "Residents",
    icon: Users,
    roles: Object.values(UserRole),
  },
  {
    to: "/care-records",
    label: "Care Records",
    icon: FileText,
    roles: Object.values(UserRole),
  },
  {
    to: "/medication",
    label: "Medication Records",
    icon: Pill,
    roles: Object.values(UserRole),
  },
  {
    to: "/integrity",
    label: "Integrity Verification",
    icon: ShieldCheck,
    roles: Object.values(UserRole),
  },
  {
    to: "/audit-logs",
    label: "Audit Logs",
    icon: ScrollText,
    roles: [
      UserRole.ADMINISTRATOR,
      UserRole.MANAGER,
      UserRole.COMPLIANCE_OFFICER,
      UserRole.INSPECTOR,
    ],
  },
  {
    to: "/compliance",
    label: "Compliance Reports",
    icon: ClipboardCheck,
    roles: [
      UserRole.ADMINISTRATOR,
      UserRole.MANAGER,
      UserRole.COMPLIANCE_OFFICER,
      UserRole.INSPECTOR,
    ],
  },
  {
    to: "/users",
    label: "Users",
    icon: UserCog,
    editOnly: true,
    roles: [UserRole.ADMINISTRATOR, UserRole.MANAGER],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    editOnly: true,
    roles: [UserRole.ADMINISTRATOR, UserRole.MANAGER],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { active: inspecting } = useInspection();
  const navigate = useNavigate();

  // Zustand Auth Store
  const { user, logout } = useAuthStore();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const canStartInspection = user && INSPECTION_MODE_ROLES.includes(user.role as UserRole);

  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  // const visibleNav = nav.filter((n) => !(inspecting && n.editOnly));

  const visibleNav = nav.filter((item) => {
    if (inspecting && item.editOnly) {
      return false;
    }

    if (!user) {
      return false;
    }

    return item.roles.includes(user.role as UserRole);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate({ to: "/login", replace: true });
  };

  // Fallback if user is not loaded yet
  const displayName = `${user?.firstName} ${user?.lastName}` || "Ella Morgan";
  const displayRole = user?.role || "Home Manager";
  const initials = user?.firstName
    ? user.firstName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EM";

  return (
    <ProtectedRoute>
      <div className="flex min-h-dvh bg-background">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sticky top-0 h-dvh">
          {/* Sidebar content unchanged */}
          <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldHalf className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">CareGuard</span>
              <span className="text-[11px] text-muted-foreground">Compliance Suite</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </p>
            <ul className="space-y-0.5">
              {visibleNav.map((item) => {
                const active = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                        (active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60")
                      }
                    >
                      <Icon
                        className={
                          "h-4 w-4 " +
                          (active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground")
                        }
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              {inspecting && (
                <li>
                  <Link
                    to="/inspection"
                    className={
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                      (pathname === "/inspection"
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary-soft text-primary hover:bg-primary/15")
                    }
                  >
                    <Gavel className="h-4 w-4" />
                    <span>Inspection Dashboard</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="mx-3 mb-4 rounded-xl border border-sidebar-border bg-primary-soft p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              {inspecting ? "Inspection in progress" : "CQC Inspection Ready"}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {inspecting
                ? "Application is read-only for inspectors."
                : "Next audit window opens in 12 days."}
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search residents, records, hashes…"
                className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {today}
              </div>

              {canStartInspection && <StartInspectionButton />}

              {/* <button
                data-inspection-hide
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-elegant hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Quick action
              </button> */}

              <button
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical ring-2 ring-card" />
              </button>

              {/* Dynamic User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-xs font-semibold">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground">{displayRole}</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          <p className="text-sm text-muted-foreground">{displayRole}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          // TODO: navigate to profile when ready
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary text-left"
                      >
                        <UserCog className="h-4 w-4" />
                        Profile Settings
                      </button>
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <InspectionBanner />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
