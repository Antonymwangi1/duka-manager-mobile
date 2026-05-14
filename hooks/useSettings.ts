import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchShop,
  updateShop,
  updateProfile,
  changePassword,
} from "../lib/api/settings";

export const useShop = (shopId: string | null) => {
  return useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => fetchShop(shopId!),
    enabled: !!shopId,
  });
};

export const useUpdateShop = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateShop>[1]) =>
      updateShop(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: updateProfile,
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
  });
};