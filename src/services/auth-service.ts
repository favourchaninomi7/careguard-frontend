// src/services/auth-service.ts
import { api } from "@/lib/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    const { data } = await api.post<{ data: AuthResponse }>("/auth/login", credentials);
    return data;
  },

  async logout() {
    // Optional: call backend logout endpoint
    await api.post("/auth/logout").catch(() => {});
  },
};
