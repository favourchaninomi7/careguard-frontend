// src/hooks/use-audit-logs.ts
import { useQuery } from "@tanstack/react-query";
import { auditService, AuditLogQuery, AuditLogItem, AuditLogMeta } from "@/services/audit-service";

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (params: AuditLogQuery) => ["audit-logs", "list", params] as const,
  entity: (entityType: string, entityId: string) =>
    ["audit-logs", "entity", entityType, entityId] as const,
  user: (userId: string) => ["audit-logs", "user", userId] as const,
};

function normalizeListResponse(res: any): { items: AuditLogItem[]; meta: AuditLogMeta } {
  // Handles both:
  // 1) { data: AuditLogItem[], meta }  (preferred backend shape)
  // 2) { data: AuditLogItem[] }        (current response you pasted)
  // 3) raw array
  const payload = res?.data ?? res;

  if (Array.isArray(payload)) {
    return {
      items: payload,
      meta: {
        total: payload.length,
        page: 1,
        limit: payload.length || 20,
        totalPages: 1,
      },
    };
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return {
      items: payload.data,
      meta: payload.meta ?? {
        total: payload.data.length,
        page: 1,
        limit: payload.data.length || 20,
        totalPages: 1,
      },
    };
  }

  return {
    items: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  };
}

export function useAuditLogs(params: AuditLogQuery = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: async () => {
      const res = await auditService.getLogs(params);
      return normalizeListResponse(res);
    },
    placeholderData: (prev) => prev, // keeps list stable while changing page
  });
}

export function useAuditByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: auditKeys.entity(entityType, entityId),
    queryFn: async () => {
      const res = await auditService.getByEntity(entityType, entityId);
      return res?.data ?? res;
    },
    enabled: !!entityType && !!entityId,
  });
}
