import { api } from "@/lib/api";

// src/types/care-record.types.ts

export enum CareRecordType {
  DAILY_NOTE = "DAILY_NOTE",
  CARE_PLAN = "CARE_PLAN",
  INCIDENT_REPORT = "INCIDENT_REPORT",
  RISK_ASSESSMENT = "RISK_ASSESSMENT",
  REVIEW = "REVIEW",
  OTHER = "OTHER",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  FAILED = "FAILED",
}

// export interface CareRecord {
//   id: string;
//   residentId: string;
//   type: string;
//   title: string;
//   content: Record<string, any>;
//   recordedAt: string;
//   recordedBy: {
//     firstName: string;
//     lastName: string;
//   };
//   status?: string;
//   hash?: string;
// }

export interface CareRecord {
  id: string;
  residentId: string;
  resident?: {
    firstName: string;
    lastName: string;
    roomNumber: string;
  };

  type: string;
  title: string;

  content: {
    vitals?: string;
    carePlan?: string;
    priority?: string;
    observationNotes?: string;
    [key: string]: any;
  };

  // Top-level priority (can be null)
  priority: string | null;

  recordedAt: string;
  recordedById: string;
  recordedBy: {
    firstName: string;
    lastName: string;
  };

  status: string;

  createdAt: string;
  updatedAt: string;

  integrity?: {
    id: string;
    entityType: string;
    entityId: string;
    versionNumber: number;
    currentHash: string;
    previousHash?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  hash?: string;
}

export interface CreateCareRecordDto {
  residentId: string;
  type: CareRecordType;
  title: string;
  status: VerificationStatus;
  content: {
    priority?: "Routine" | "Elevated" | "Urgent";
    vitals?: string;
    observationNotes: string;
    carePlan?: string;
    [key: string]: any; // for future flexibility
  };
  recordedAt: string;
}

export interface CareRecordsResponse {
  data: CareRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CareRecordsStats {
  totalRecords: number;
  verifiedToday: number;
  pendingReview: number;
  failedIntegrity: number;
}

export const careRecordsService = {
  async create(data: CreateCareRecordDto): Promise<{ data: CareRecord }> {
    const response = await api.post<{ data: CareRecord }>("/care-records", data);
    return response.data;
  },

  // You can add more methods later
  async getByResident(residentId: string) {
    const { data } = await api.get(`/care-records/resident/${residentId}`);
    return data;
  },

  async getAll(page: number = 1, limit: number = 50): Promise<CareRecordsResponse> {
    const { data } = await api.get<{ data: CareRecordsResponse }>(
      `/care-records?page=${page}&limit=${limit}`,
    );
    return data.data; // Ensure we return the correct shape
  },

  async getStats(): Promise<{ data: CareRecordsStats }> {
    const { data } = await api.get<{ data: CareRecordsStats }>("/care-records/stats");
    return data;
  },
};
