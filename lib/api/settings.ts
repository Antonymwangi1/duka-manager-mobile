import { apiClient } from "./client";

export interface ShopSettings {
  id: string;
  name: string;
  location?: string | null;
  phone?: string | null;
  currency: string;
  plan: string;
  defaultLowStockThreshold: number;
}

export interface ProfileData {
  name?: string;
  phone?: string;
}

export const fetchShop = async (shopId: string): Promise<ShopSettings> => {
  const { data } = await apiClient.get("/api/shop", {
    params: { shopId },
  });
  return data.data.shop;
};

export const updateShop = async (
  shopId: string,
  payload: {
    name?: string;
    location?: string;
    phone?: string;
    defaultLowStockThreshold?: number;
  }
): Promise<ShopSettings> => {
  const { data } = await apiClient.patch("/api/shop", { shopId, ...payload });
  return data.data.shop;
};

export const updateProfile = async (payload: ProfileData) => {
  const { data } = await apiClient.patch("/api/profile", payload);
  return data.data.user;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const { data } = await apiClient.patch("/api/profile/password", {
    currentPassword,
    newPassword,
  });
  return data;
};