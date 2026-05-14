import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  shopId: string | null;
  role: string | null;
  isLoading: boolean;

  setAuth: (
    token: string,
    user: AuthUser,
    shopId: string,
    role: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>; // ← new
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  shopId: null,
  role: null,
  isLoading: true,

  setAuth: async (token, user, shopId, role, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync("accessToken", token),
      SecureStore.setItemAsync("refreshToken", refreshToken),
      SecureStore.setItemAsync("user", JSON.stringify(user)),
      SecureStore.setItemAsync("shopId", shopId),
      SecureStore.setItemAsync("role", role),
    ]);
    set({ token, user, shopId, role });
  },

  updateUser: async (user) => {
    // ← new
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ user });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
      SecureStore.deleteItemAsync("user"),
      SecureStore.deleteItemAsync("shopId"),
      SecureStore.deleteItemAsync("role"),
    ]);
    set({ token: null, user: null, shopId: null, role: null });
  },

  loadFromStorage: async () => {
    try {
      const [token, userJson, shopId, role] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("user"),
        SecureStore.getItemAsync("shopId"),
        SecureStore.getItemAsync("role"),
      ]);

      if (token && userJson && shopId && role) {
        set({ token, user: JSON.parse(userJson), shopId, role });
      }
    } catch {
      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("user"),
        SecureStore.deleteItemAsync("shopId"),
        SecureStore.deleteItemAsync("role"),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },
}));
