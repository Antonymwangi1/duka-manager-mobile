import { apiClient } from "./client";

export type PeriodType = "daily" | "weekly" | "monthly";

export interface ReportData {
  shopId: string;
  period: string;
  periodType: PeriodType;
  totalRevenue: number;
  totalCOGS: number;
  totalSales: number;
  grossProfit: number;
  totalDiscount: number;
  totalTransactions: number;
  topProductsJson: { name: string; quantity: number }[];
}

export const fetchReport = async (
  shopId: string,
  periodType: PeriodType,
  date: string,
): Promise<ReportData> => {
  const { data } = await apiClient.get("/api/reports", {
    params: { shopId, periodType, date },
  });
  return data.data;
};
