// src/services/dashboard-service.ts
import { api } from "@/lib/api";

export interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  tone: "info" | "neutral" | "success" | "warning" | "critical";
}

export interface DashboardData {
  greetingName: string;
  careHomeName: string;
  totalResidents: number;
  kpis: DashboardKpi[];
  complianceTrend: { m: string; score: number }[];
  integrityData: { d: string; verified: number; failed: number }[];
  medsData: { d: string; pct: number }[];
  activity: {
    title: string;
    meta: string;
    time: string;
    tone: "success" | "info" | "critical" | "neutral";
    icon: string;
  }[];
  alerts: {
    title: string;
    record: string;
    severity: "critical" | "warning";
    time: string;
  }[];
  reviews: {
    name: string;
    room: string;
    due: string;
    tone: "warning" | "info" | "neutral";
  }[];
  auditLog: {
    user: string;
    action: string;
    time: string;
  }[];
  complianceScore: number;
  complianceRating: string;
  cqcBreakdown: { safe: number; effective: number; wellLed: number };
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get("/dashboard");
    return data?.data ?? data;
  },
};
