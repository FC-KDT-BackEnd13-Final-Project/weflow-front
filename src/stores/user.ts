// src/stores/user.ts
import { create } from "zustand";
import api from "@/apis/api";
import { UserProfile } from "@/apis/auth";

interface UserState {
  user: ProjectScopedUser | null;
  setUser: (user: ProjectScopedUser) => void;
  clearUser: () => void;
}

// 클라이언트에서만 사용하는 보조 타입
export type ProjectScopedUser = UserProfile & {
  projectRole?: "ADMIN" | "MEMBER" | null;
  userRole?: "CLIENT" | "AGENCY";
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  
  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),
}));
