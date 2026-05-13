import { Feather } from "@expo/vector-icons";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReport } from "../../../hooks/useReport";
import { PeriodType } from "../../../lib/api/reports";
import { useAuthStore } from "../../../lib/stores/authStore";

const COLORS = {
  bg: "#282828",
  bgSoft: "#32302f",
  bgHard: "#1d2021",
  fg: "#ebdbb2",
  yellow: "#fabd2f",
  green: "#b8bb26",
  red: "#fb4934",
  blue: "#83a598",
  gray: "#928374",
};

function formatKES(amount: number) {
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

const PERIODS: { label: string; value: PeriodType }[] = [
  { label: "Day", value: "daily" },
  { label: "Week", value: "weekly" },
  { label: "Month", value: "monthly" },
];

// Navigate dates by period type
function navigateDate(date: Date, period: PeriodType, direction: 1 | -1): Date {
  switch (period) {
    case "daily":
      return direction === 1 ? addDays(date, 1) : subDays(date, 1);
    case "weekly":
      return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "monthly":
      return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
  }
}

// Human-readable period label
function periodLabel(date: Date, period: PeriodType): string {
  switch (period) {
    case "daily":
      return format(date, "EEE, d MMM yyyy");
    case "weekly": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return `Week of ${format(start, "d MMM yyyy")}`;
    }
    case "monthly":
      return format(startOfMonth(date), "MMMM yyyy");
  }
}

// Bar chart component
function HorizontalBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <Text style={{ color: COLORS.fg, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: COLORS.gray, fontSize: 12 }}>
          {formatKES(value)}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          backgroundColor: COLORS.bgHard,
          borderRadius: 3,
        }}
      >
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            width: `${pct}%`,
          }}
        />
      </View>
    </View>
  );
}

// Metric row
function MetricRow({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bgHard,
      }}
    >
      <Text style={{ color: COLORS.gray, fontSize: 14 }}>{label}</Text>
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            color: valueColor ?? COLORS.fg,
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {value}
        </Text>
        {sub && (
          <Text style={{ color: COLORS.gray, fontSize: 11, marginTop: 1 }}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function Reports() {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuthStore();
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [activeDate, setActiveDate] = useState(new Date());

  const dateStr = format(activeDate, "yyyy-MM-dd");
  const isToday =
    format(activeDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isFuture = activeDate > new Date();

  const { data, isLoading, isError, refetch, isRefetching } = useReport(
    shopId,
    period,
    dateStr,
  );

  const profitMargin =
    data && data.totalRevenue > 0
      ? ((data.grossProfit / data.totalRevenue) * 100).toFixed(1)
      : "0";

  const isProfitable = Number(profitMargin) > 0;

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
    setActiveDate(new Date()); // Reset to today on period switch
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: COLORS.bg,
        }}
      >
        <Text
          style={{
            color: COLORS.fg,
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 14,
          }}
        >
          Reports
        </Text>

        {/* Period Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: COLORS.bgSoft,
            borderRadius: 10,
            padding: 4,
            marginBottom: 14,
          }}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => handlePeriodChange(p.value)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor:
                  period === p.value ? COLORS.yellow : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: period === p.value ? COLORS.bg : COLORS.gray,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: COLORS.bgSoft,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveDate((d) => navigateDate(d, period, -1))}
            style={{ padding: 4 }}
          >
            <Feather name="chevron-left" size={20} color={COLORS.fg} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveDate(new Date())}>
            <Text
              style={{
                color: isToday ? COLORS.yellow : COLORS.fg,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {isToday ? "Today" : periodLabel(activeDate, period)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveDate((d) => navigateDate(d, period, 1))}
            disabled={isFuture}
            style={{ padding: 4, opacity: isFuture ? 0.3 : 1 }}
          >
            <Feather name="chevron-right" size={20} color={COLORS.fg} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.yellow} size="large" />
          <Text style={{ color: COLORS.gray, marginTop: 12, fontSize: 13 }}>
            Generating report...
          </Text>
        </View>
      ) : isError ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Feather name="alert-circle" size={32} color={COLORS.red} />
          <Text style={{ color: COLORS.fg, fontWeight: "600", marginTop: 12 }}>
            Failed to load report
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 16,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: COLORS.bgSoft,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: COLORS.yellow, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            paddingTop: 8,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.yellow}
              colors={[COLORS.yellow]}
            />
          }
        >
          {/* Profit Margin Hero */}
          <View
            style={{
              backgroundColor: COLORS.bgSoft,
              borderRadius: 14,
              padding: 20,
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: isProfitable
                ? COLORS.green + "40"
                : COLORS.red + "40",
            }}
          >
            <Text style={{ color: COLORS.gray, fontSize: 13, marginBottom: 6 }}>
              Profit Margin
            </Text>
            <Text
              style={{
                color: isProfitable ? COLORS.green : COLORS.red,
                fontSize: 42,
                fontWeight: "700",
              }}
            >
              {profitMargin}%
            </Text>
            <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 4 }}>
              {periodLabel(activeDate, period)}
            </Text>
          </View>

          {/* Key Metrics */}
          <View
            style={{
              backgroundColor: COLORS.bgSoft,
              borderRadius: 14,
              paddingHorizontal: 16,
              marginBottom: 12,
            }}
          >
            <MetricRow
              label="Revenue"
              value={formatKES(data?.totalRevenue ?? 0)}
              valueColor={COLORS.yellow}
            />
            <MetricRow
              label="Cost of Goods"
              value={formatKES(data?.totalCOGS ?? 0)}
              valueColor={COLORS.blue}
            />
            <MetricRow
              label="Gross Profit"
              value={formatKES(data?.grossProfit ?? 0)}
              valueColor={
                (data?.grossProfit ?? 0) >= 0 ? COLORS.green : COLORS.red
              }
            />
            <MetricRow
              label="Discounts Given"
              value={formatKES(data?.totalDiscount ?? 0)}
              valueColor={COLORS.red}
            />
            <MetricRow
              label="Transactions"
              value={String(data?.totalTransactions ?? 0)}
              sub={
                data && data.totalTransactions > 0
                  ? `Avg ${formatKES(data.totalRevenue / data.totalTransactions)} per sale`
                  : undefined
              }
            />
          </View>

          {/* Revenue Breakdown */}
          {data && data.totalRevenue > 0 && (
            <View
              style={{
                backgroundColor: COLORS.bgSoft,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.fg,
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: 16,
                }}
              >
                Revenue Breakdown
              </Text>
              <HorizontalBar
                label="Revenue"
                value={data.totalRevenue}
                maxValue={data.totalRevenue}
                color={COLORS.yellow}
              />
              <HorizontalBar
                label="Cost of Goods"
                value={data.totalCOGS}
                maxValue={data.totalRevenue}
                color={COLORS.blue}
              />
              <HorizontalBar
                label="Gross Profit"
                value={data.grossProfit}
                maxValue={data.totalRevenue}
                color={COLORS.green}
              />
            </View>
          )}

          {/* Top Products */}
          {data && data.topProductsJson && data.topProductsJson.length > 0 && (
            <View
              style={{
                backgroundColor: COLORS.bgSoft,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: COLORS.fg,
                  fontWeight: "700",
                  fontSize: 15,
                  marginBottom: 16,
                }}
              >
                Top Products
              </Text>
              {data.topProductsJson.map((product, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom:
                      index < data.topProductsJson.length - 1 ? 14 : 0,
                  }}
                >
                  {/* Rank badge */}
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor:
                        index === 0 ? COLORS.yellow : COLORS.bgHard,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: index === 0 ? COLORS.bg : COLORS.gray,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Name + bar */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: COLORS.fg,
                        fontSize: 13,
                        fontWeight: "500",
                        marginBottom: 4,
                      }}
                    >
                      {product.name}
                    </Text>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: COLORS.bgHard,
                        borderRadius: 2,
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            index === 0 ? COLORS.yellow : COLORS.blue,
                          width: `${
                            (product.quantity /
                              data.topProductsJson[0].quantity) *
                            100
                          }%`,
                        }}
                      />
                    </View>
                  </View>

                  {/* Qty */}
                  <Text
                    style={{
                      color: COLORS.gray,
                      fontSize: 12,
                      marginLeft: 12,
                      minWidth: 50,
                      textAlign: "right",
                    }}
                  >
                    {product.quantity} sold
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {data && data.totalTransactions === 0 && (
            <View
              style={{
                alignItems: "center",
                paddingTop: 20,
                paddingBottom: 10,
              }}
            >
              <Feather name="inbox" size={32} color={COLORS.gray} />
              <Text
                style={{
                  color: COLORS.gray,
                  fontSize: 13,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                No sales recorded for this period.{"\n"}Make a sale to see your
                report.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
