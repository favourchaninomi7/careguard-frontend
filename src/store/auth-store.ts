// src/store/auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/auth-service";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authService.login(credentials);
          localStorage.setItem("token", res.data.accessToken);


          set({
            user: res.data.user,
            token: res.data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          console.log({ error });
          throw error;
        }
      },

      logout: async () => {
        // await authService.logout();
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "auth-storage" },
  ),
);
