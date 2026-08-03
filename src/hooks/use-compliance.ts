// src/hooks/use-compliance.ts
import { useQuery } from "@tanstack/react-query";
import { complianceService, ComplianceDashboard } from "@/services/compliance-service";

export const complianceKeys = {
  all: ["compliance"] as const,
  dashboard: () => ["compliance", "dashboard"] as const,
};

export function useComplianceDashboard() {
  return useQuery({
    queryKey: complianceKeys.dashboard(),
    queryFn: () => complianceService.getDashboard(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
