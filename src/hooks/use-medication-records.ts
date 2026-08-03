import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  medicationRecordsService,
  CreateMedicationRecordDto,
  ContinueMedicationPayload,
  MedicationRecord,
  MedicationRecordQueryParams,
  UpdateMedicationPayload,
} from "@/services/medication-records-service";

import { toast } from "sonner";

export const medicationRecordKeys = {
  all: ["medication-records"] as const,

  list: (params?: MedicationRecordQueryParams) => ["medication-records", "list", params] as const,

  byResident: (residentId: string) => ["medication-records", "resident", residentId] as const,
};

export function useMedicationRecords(params?: MedicationRecordQueryParams) {
  return useQuery({
    queryKey: medicationRecordKeys.list(params),

    queryFn: () => medicationRecordsService.getAll(params),
  });
}

export function useMedicationRecordsByResident(residentId: string, enabled = true) {
  return useQuery<MedicationRecord[]>({
    queryKey: medicationRecordKeys.byResident(residentId),
    queryFn: () => medicationRecordsService.getByResident(residentId),
    enabled: enabled && !!residentId,
  });
}

export function useCreateMedicationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMedicationRecordDto) => medicationRecordsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicationRecordKeys.all });
    },
  });
}

export function useContinueMedicationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: ContinueMedicationPayload) =>
      medicationRecordsService.continueMedication(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: medicationRecordKeys.all,
      });
    },
  });
}

export function useUpdateMedicationRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMedicationPayload) =>
      medicationRecordsService.update(payload.id, payload.payload),

    onSuccess: () => {
      toast.success("Medication record updated");

      queryClient.invalidateQueries({
        queryKey: medicationRecordKeys.all,
      });
    },

    onError: () => {
      toast.error("Failed to update medication record");
    },
  });
}
