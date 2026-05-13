import { apiClient } from "./client";

export interface Product {
  id: string;
  name: string;
  sku?: string;
  buyingPrice: number;
  sellingPrice: number;
  stockQty: number;
  unit: string;
  category?: string;
  isActive: boolean;
  lowStockThreshold?: number;
}

export interface ProductData {
  name: string;
  sku?: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  stockQty: number;
  categoryId?: string;
  imageUrl?: string;
}

export const fetchProducts = async (shopId: string): Promise<Product[]> => {
  const { data } = await apiClient.get("/api/products", {
    params: { shopId },
  });
  return data.data.products;
};

export const createProduct = async (
  shopId: string,
  productData: ProductData,
): Promise<Product> => {
  const { data } = await apiClient.post("/api/products", {
    shopId,
    ...productData,
  });
  return data.data;
};

export const updateProduct = async (
  shopId: string,
  productId: string,
  productData: Partial<ProductData>,
): Promise<Product> => {
  const { data } = await apiClient.patch(`/api/products/${productId}`, {
    shopId,
    ...productData,
  });
  return data.data;
};

export const deleteProduct = async (
  shopId: string,
  productId: string,
): Promise<void> => {
  await apiClient.delete(`/api/products/${productId}`, {
    params: { shopId },
  });
};
