// src/services/audit-service.ts
import { api } from "@/lib/api";

export interface AuditLogUser {
  id: string;
  name: string;
  role: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  user: AuditLogUser;
  status: string;
  statusLabel: string;
  oldHash: string | null;
  newHash: string | null;
  residentName: string | null;
  residentId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  error: string | null;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogListResponse {
  data: AuditLogItem[];
  meta: AuditLogMeta;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  residentId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export const auditService = {
  async getLogs(params: AuditLogQuery = {}) {
    const res = await api.get("/audit/logs", { params });
    // api body is usually { success, message, data, timestamp }
    // where data is either the list or { data, meta }
    const payload = res.data;
    return {
      data: payload?.data ?? payload,
      meta: payload?.meta ?? res.data?.meta,
    };
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data } = await api.get(`/audit/entity/${entityType}/${entityId}`);
    return data;
  },

  async getByUser(userId: string) {
    const { data } = await api.get(`/audit/user/${userId}`);
    return data;
  },
};
