// src/services/compliance-service.ts
import { api } from "@/lib/api";

export interface ComplianceTrendPoint {
  m: string; // "Jan", "Feb", …
  score: number;
}

export interface ComplianceCategory {
  label: "Safe" | "Effective" | "Caring" | "Responsive" | "Well-led";
  score: number;
}

export interface ComplianceReportItem {
  id: string;
  name: string;
  period: string;
  format: string; // "PDF" | "CSV"
  size: string;
  fileUrl?: string | null;
}

export interface ComplianceDashboard {
  overallScore: number;
  rating: string; // "Outstanding" | "Good" | …
  trend: ComplianceTrendPoint[];
  categories: ComplianceCategory[];
  reports: ComplianceReportItem[];
}

// src/services/compliance-service.ts  (or create reports-service.ts)

export interface GenerateReportPayload {
  type?: "COMPLIANCE" | "INTEGRITY" | "AUDIT_TRAIL" | "FULL_RESIDENT";
  period?: string;
  format?: string;
  dateFrom?: string;
  dateTo?: string;
  sections?: string[];
  residentId?: string;
}

export const complianceService = {
  async getDashboard(): Promise<ComplianceDashboard> {
    const { data } = await api.get("/compliance/dashboard");
    // Handles both { data: {...} } and direct object
    return data?.data ?? data;
  },

  // async generateReport(payload: GenerateReportPayload) {
  //   const { data } = await api.post("/reports/generate", {
  //     type: "COMPLIANCE", // default for this modal
  //     ...payload,
  //   });
  //   return data?.data ?? data;
  // },

  async generateReport(payload: any) {
    const { data } = await api.post("/reports/generate", {
      type: "COMPLIANCE",
      ...payload,
    });
    return data?.data ?? data;
  },

  async getReportStatus(id: string) {
    const { data } = await api.get(`/reports/${id}/status`);
    return data?.data ?? data;
  },

  getDownloadUrl(id: string) {
    // Use the same base URL as your api instance
    return `${api.defaults.baseURL}/reports/${id}/download`;
  },
};
