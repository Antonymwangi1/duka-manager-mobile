import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStaffMember,
  CreateStaffData,
  fetchStaff,
  removeStaffMember,
} from "../lib/api/staff";

export const useStaff = (shopId: string | null) => {
  return useQuery({
    queryKey: ["staff", shopId],
    queryFn: () => fetchStaff(shopId!),
    enabled: !!shopId,
  });
};

export const useCreateStaff = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffData) => createStaffMember(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", shopId] });
    },
  });
};

export const useRemoveStaff = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shopUserId: string) => removeStaffMember(shopId, shopUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", shopId] });
    },
  });
};