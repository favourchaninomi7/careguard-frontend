import { api } from "@/lib/api";

export enum MedicationRecordType {
  ADMINISTRATION = "ADMINISTRATION",
  PRESCRIPTION = "PRESCRIPTION",
  REFUSAL = "REFUSAL",
  STOCK_CHECK = "STOCK_CHECK",
}

export enum MedicationIntervalUnit {
  HOUR = "HOUR",
  DAY = "DAY",
}

export enum MedicationStatus {
  PENDING = "PENDING",
  ADMINISTERED = "ADMINISTERED",
  REFUSED = "REFUSED",
  MISSED = "MISSED",
}

export interface CreateMedicationRecordDto {
  residentId: string;

  medicationName: string;

  dosage: string;

  intervalValue: number;

  intervalUnit: MedicationIntervalUnit;

  remainingCount: number;

  administeredAt: string;

  nextDueAt?: string;

  status: MedicationStatus;

  notes?: string;
}

export interface MedicationRecordQueryParams {
  page?: number;
  limit?: number;

  search?: string;

  residentId?: string;

  administeredById?: string;

  medicationName?: string;

  status?: MedicationStatus;

  from?: string;

  to?: string;

  due?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface MedicationRecord {
  id: string;

  medicationName: string;

  dosage: string;

  intervalValue: number;

  intervalUnit: MedicationIntervalUnit;

  remainingCount: number;

  nextDueAt: string | null;

  administeredAt: string;

  status: MedicationStatus;

  notes?: string;

  resident: {
    firstName: string;
    lastName: string;
    roomNumber: string;
  };
  administeredBy: {
    firstName: string;
    lastName: string;
  };
}

export interface ContinueMedicationDto {
  administeredAt: string;
  status: MedicationStatus;
  notes?: string;
}

export interface ContinueMedicationPayload {
  id: string;
  payload: ContinueMedicationDto;
}

export interface UpdateMedicationRecordDto {
  notes?: string;
  status?: MedicationStatus;
}

export interface UpdateMedicationPayload {
  id: string;
  payload: UpdateMedicationRecordDto;
}

export const medicationRecordsService = {
  async create(data: CreateMedicationRecordDto) {
    const response = await api.post("/medication-records", data);
    return response.data;
  },

  async getByResident(residentId: string) {
    const { data } = await api.get(`/medication-records/resident/${residentId}`);
    return data;
  },

  async continueMedication(id: string, data: ContinueMedicationDto) {
    const response = await api.post(`/medication-records/${id}/continue`, data);

    return response.data;
  },

  async getAll(params?: MedicationRecordQueryParams): Promise<PaginatedResponse<MedicationRecord>> {
    const { data } = await api.get("/medication-records", {
      params,
    });

    return data;
  },

  update(id: string, payload: UpdateMedicationRecordDto) {
    return api.patch<MedicationRecord>(`/medication-records/${id}`, payload);
  },
};
