// src/services/integrity-service.ts
import { api } from "@/lib/api";

export interface IntegrityStats {
  recordsVerified: number;
  successRate: number;
  modifiedRecords: number;
  failedVerification: number;
}

export interface IntegrityTrendPoint {
  d: string; // "D1" … "D14"
  verified: number;
  failed: number;
}

export interface IntegrityAlert {
  title: string;
  record: string;
  user: string;
  time: string;
  severity: "critical" | "warning";
}

export interface IntegrityQueueItem {
  id: string;
  type: string;
  resident: string;
  hash: string;
  status: "Verified" | "Integrity failed" | "Warning" | "Pending";
}

export interface IntegrityDashboardResponse {
  stats: IntegrityStats;
  trend: IntegrityTrendPoint[];
  alerts: IntegrityAlert[];
  queue: IntegrityQueueItem[];
}

// Add this to the existing integrityService

export interface VerifyAllResult {
  totalProcessed: number;
  verified: number;
  failed: number;
  results: {
    entityType: string;
    entityId: string;
    status: "Verified" | "Integrity failed";
    reason?: string;
  }[];
  completedAt: string;
}

export const integrityService = {
  async getDashboard(): Promise<IntegrityDashboardResponse> {
    const { data } = await api.get("/record-integrity/dashboard");
    // Handles both { data: {...} } and direct object responses
    return data?.data ?? data;
  },

  async verifyAll(force = false): Promise<VerifyAllResult> {
    const url = "/record-integrity/verify-all?force=true";
    // const url = force ? "/record-integrity/verify-all?force=true" : "/record-integrity/verify-all";

    const { data } = await api.post(url);
    return data?.data ?? data;
  },

  // integrity-service.ts
  // async getHistory(entityType: string, entityId: string) {
  //   // const { data } = await api.get(`/record-integrity/${entityType}/${entityId}/history`);
  //   const { data } = await api.get(`/record-integrity/by-entity/${entityId}`);
  //   const rows = data?.data ?? data ?? [];
  //   return Array.isArray(rows) ? rows : [];
  // },

  async getHistory(entityType: string, entityId: string) {
    // Prefer type-specific history when type is known
    // if (entityType) {
    //   const { data } = await api.get(
    //     `/record-integrity/${entityType}/${entityId}/history`,
    //   );
    //   const rows = data?.data ?? data ?? [];
    //   if (Array.isArray(rows) && rows.length > 0) return rows;
    // }

    // Fallback: all rows for this entityId
    const { data } = await api.get(`/record-integrity/by-entity/${entityId}`);
    return data?.data ?? data ?? [];
  },

  async getHistoryByEntityId(entityId: string) {
    const clean = entityId.replace(/^RES-/i, "");
    const { data } = await api.get(`/record-integrity/by-entity/${clean}`);
    return data?.data ?? data ?? [];
  },

  //   async verifyAll(force = false): Promise<VerifyAllResult> {
  //     const { data } = await api.post(
  //       "/record-integrity/verify-all",
  //       {},
  //       {
  //         params: { force },
  //       },
  //     );
  //     return data?.data ?? data;
  //   },
};
