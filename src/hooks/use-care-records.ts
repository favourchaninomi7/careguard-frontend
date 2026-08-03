import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { careRecordsService, CreateCareRecordDto } from "@/services/care-records-service";

export const careRecordKeys = {
  all: ["care-records"] as const,
  paginated: (page: number, limit: number) => ["care-records", { page, limit }] as const,
  stats: ["care-records", "stats"] as const,
  byResident: (residentId: string) => ["care-records", residentId] as const,
};

export function useCreateCareRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCareRecordDto) => careRecordsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careRecordKeys.all });
    },
  });
}

// New: Get all care records with pagination
export function useCareRecords(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: careRecordKeys.paginated(page, limit),
    queryFn: () => careRecordsService.getAll(page, limit),
  });
}

// New: Get summary statistics for the cards
export function useCareRecordsStats() {
  return useQuery({
    queryKey: careRecordKeys.stats,
    queryFn: () => careRecordsService.getStats(),
  });
}

// Optional: Keep this if you still need it
export function useCareRecordsByResident(residentId: string) {
  return useQuery({
    queryKey: careRecordKeys.byResident(residentId),
    queryFn: () => careRecordsService.getByResident(residentId),
    enabled: !!residentId,
  });
}
