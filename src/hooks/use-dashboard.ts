// src/hooks/use-dashboard.ts
import { useQuery } from "@tanstack/react-query";
import { dashboardService, DashboardData } from "@/services/dashboard-service";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  main: () => ["dashboard", "main"] as const,
};

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.main(),
    queryFn: () => dashboardService.getDashboard(),
    staleTime: 1000 * 60, // 1 minute
  });
}
