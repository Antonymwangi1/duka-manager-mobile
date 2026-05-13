import { apiClient } from "./client";

export type StaffRole = "OWNER" | "MANAGER" | "CASHIER";

export interface StaffMember {
  id: string;
  role: StaffRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface CreateStaffData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "MANAGER" | "CASHIER";
}

export const fetchStaff = async (shopId: string): Promise<StaffMember[]> => {
  const { data } = await apiClient.get("/api/staff", {
    params: { shopId },
  });
  return data.data.staff;
};

export const createStaffMember = async (
  shopId: string,
  staffData: CreateStaffData
): Promise<StaffMember> => {
  const { data } = await apiClient.post("/api/staff", {
    shopId,
    ...staffData,
  });
  return data.data.staff;
};

export const removeStaffMember = async (
  shopId: string,
  shopUserId: string
): Promise<void> => {
  await apiClient.delete(`/api/staff/${shopUserId}`, {
    params: { shopId },
  });
};