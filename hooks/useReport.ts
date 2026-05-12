import { useQuery } from "@tanstack/react-query";
import { fetchReport, PeriodType } from "../lib/api/reports";

export const useReport = (
  shopId: string | null,
  periodType: PeriodType,
  date: string,
) => {
  return useQuery({
    queryKey: ["report", shopId, periodType, date],
    queryFn: () => fetchReport(shopId!, periodType, date),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
};
