// src/services/auth-service.ts
import { api } from "@/lib/api";

export enum UserRole {
  ADMINISTRATOR = "ADMINISTRATOR",
  MANAGER = "MANAGER",
  CARE_STAFF = "CARE_STAFF",
  COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER",
  INSPECTOR = "INSPECTOR",
}

export const INSPECTION_MODE_ROLES: UserRole[] = [
  UserRole.ADMINISTRATOR,
  UserRole.MANAGER,
  UserRole.COMPLIANCE_OFFICER,
  UserRole.INSPECTOR,
] as const;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  isActive?: boolean;
}

export const userService = {
  async create(user: CreateUserDto): Promise<{ data: User }> {
    const { data } = await api.post<{ data: User }>("/users", user);
    return data;
  },

  async getAll(): Promise<{ data: User[] }> {
    const { data } = await api.get<{ data: User[] }>("/users");
    return data;
  },

  async getById(id: string): Promise<{ data: User }> {
    const { data } = await api.get<{ data: User }>(`/users/${id}`);
    return data;
  },

  async update(id: string, user: UpdateUserDto): Promise<{ data: User }> {
    const { data } = await api.patch<{ data: User }>(`/users/${id}`, user);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
