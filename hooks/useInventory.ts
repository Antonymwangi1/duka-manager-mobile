import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  ProductData,
  updateProduct,
} from "../lib/api/inventory";

export const useProducts = (shopId: string | null) => {
  return useQuery({
    queryKey: ["products", shopId],
    queryFn: () => fetchProducts(shopId!),
    enabled: !!shopId,
  });
};

export const useCreateProduct = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductData) => createProduct(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
    },
  });
};

export const useUpdateProduct = (shopId: string, productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductData>) =>
      updateProduct(shopId, productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
    },
  });
};

export const useDeleteProduct = (shopId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(shopId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
    },
  });
};
