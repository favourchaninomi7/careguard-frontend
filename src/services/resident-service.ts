// src/services/resident-service.ts
import { api } from "@/lib/api";

export interface Resident {
  id: string;
  careHomeId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  admissionDate: string;
  dischargeDate?: string | null;
  status: string;
  condition: string;
  allergies?: string;
  profileImageUrl?: string | null;
  roomNumber?: string;
  medicalNotes?: string;
  profileComplete: boolean;
  primaryCaregiverId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  primaryCaregiver?: {
    firstName: string;
    lastName: string;
  };
  emergencyContacts?: Array<{
    id: string;
    fullName: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
  }>;
}

export interface CreateResidentDto {
  careHomeId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  admissionDate: string;
  roomNumber?: string;
  medicalNotes?: string;
  gender: string;
  condition: string;
  primaryCaregiverId: string;
  allergies?: string;
  profileImageUrl?: string;
}

export interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  roomNumber?: string;
  medicalNotes?: string;
  gender?: string;
  condition?: string;
  primaryCaregiverId?: string;
  allergies?: string;
  profileComplete?: boolean;
}

export const residentService = {
  async getAll() {
    const { data } = await api.get("/residents");
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/residents/${id}`);
    return data;
  },

  async create(payload: CreateResidentDto) {
    const { data } = await api.post("/residents", payload);
    return data;
  },

  async update(id: string, payload: UpdateResidentDto) {
    const { data } = await api.patch(`/residents/${id}`, payload);
    return data;
  },

  async archive(id: string) {
    const { data } = await api.delete(`/residents/${id}`);
    return data;
  },

  async getCaregivers() {
    const { data } = await api.get("/users/caregivers");
    return data;
  },
};
