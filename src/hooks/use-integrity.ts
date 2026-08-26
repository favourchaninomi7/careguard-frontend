// src/hooks/use-integrity.ts
import { useQuery } from "@tanstack/react-query";
import { integrityService, IntegrityDashboardResponse } from "@/services/integrity-service";

export const integrityKeys = {
  all: ["integrity"] as const,
  dashboard: () => ["integrity", "dashboard"] as const,
};

export function useIntegrityDashboard() {
  return useQuery({
    queryKey: integrityKeys.dashboard(),
    queryFn: () => integrityService.getDashboard(),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useIntegrityHistory(entityType: string, entityId: string, enabled = true) {
  return useQuery({
    queryKey: ["integrity-history", entityType, entityId],
    queryFn: () => integrityService.getHistory(entityType, entityId),
    enabled: enabled && !!entityType && !!entityId,
  });
}
