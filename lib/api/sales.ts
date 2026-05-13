import { apiClient } from "./client";

export type PaymentMethod = "CASH" | "MPESA" | "CARD" | "CREDIT";

export interface SaleItem {
  productId: string;
  quantity: number;
}

export interface SalePayload {
  shopId: string;
  paymentMethod: PaymentMethod;
  mpesaRef?: string;
  discount: number;
  amountPaid: number;
  items: SaleItem[];
}

export interface SaleResponse {
  id: string;
  receiptNumber: string;
  total: number;
  change: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  items: {
    product: { name: string };
    quantity: number;
    sellingPrice: number;
    lineTotal: number;
  }[];
}

export const createSale = async (
  payload: SalePayload
): Promise<SaleResponse> => {
  const { data } = await apiClient.post("/api/sales", payload);
  return data.data;
};