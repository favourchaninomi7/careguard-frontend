// src/hooks/use-residents.ts

import { residentService, CreateResidentDto, UpdateResidentDto } from "@/services/resident-service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const residentKeys = {
  all: ["residents"] as const,
  detail: (id: string) => ["residents", id] as const,
  caregivers: ["caregivers"] as const,
};

export function useResidents() {
  return useQuery({
    queryKey: residentKeys.all,
    queryFn: async () => {
      const res = await residentService.getAll();
      return res.data;
    },
  });
}

export function useResident(id: string) {
  return useQuery({
    queryKey: residentKeys.detail(id),
    queryFn: async () => {
      const res = await residentService.getById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCaregivers() {
  return useQuery({
    queryKey: residentKeys.caregivers,
    queryFn: async () => {
      const res = await residentService.getCaregivers();
      return res.data;
    },
  });
}

export function useCreateResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResidentDto) => residentService.create(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: residentKeys.all,
      });
    },
  });
}

export function useUpdateResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResidentDto }) =>
      residentService.update(id, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: residentKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: residentKeys.detail(variables.id),
      });
    },
  });
}

export function useArchiveResident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => residentService.archive(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: residentKeys.all,
      });
    },
  });
}
