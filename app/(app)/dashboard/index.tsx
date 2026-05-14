import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
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

// Format KES currency
function formatKES(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  sub?: string;
  subPositive?: boolean;
}

function StatCard({
  label,
  value,
  icon,
  iconColor,
  sub,
  subPositive,
}: StatCardProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.bgSoft,
        borderRadius: 12,
        padding: 16,
        flex: 1,
        minWidth: "47%",
        margin: 4,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={{ color: COLORS.gray, fontSize: 12 }}>{label}</Text>
        <Feather name={icon} size={16} color={iconColor} />
      </View>
      <Text style={{ color: COLORS.fg, fontSize: 20, fontWeight: "700" }}>
        {value}
      </Text>
      {sub && (
        <Text
          style={{
            color: subPositive ? COLORS.green : COLORS.red,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          {sub}
        </Text>
      )}
    </View>
  );
}

const PERIODS: { label: string; value: PeriodType }[] = [
  { label: "Today", value: "daily" },
  { label: "This Week", value: "weekly" },
  { label: "This Month", value: "monthly" },
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user, shopId } = useAuthStore();
  const [activePeriod, setActivePeriod] = useState<PeriodType>("daily");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, isError, refetch, isRefetching } = useReport(
    shopId,
    activePeriod,
    today,
  );

  const profitMargin = data
    ? data.totalRevenue > 0
      ? ((data.grossProfit / data.totalRevenue) * 100).toFixed(1)
      : "0"
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 24,
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
        {/* Header */}

        {/* Header */}
        <View
          style={{
            marginBottom: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text style={{ color: COLORS.gray, fontSize: 13 }}>
              {format(new Date(), "EEEE, d MMMM yyyy")}
            </Text>
            <Text
              style={{
                color: COLORS.fg,
                fontSize: 22,
                fontWeight: "700",
                marginTop: 2,
              }}
            >
              Hey, {user?.name?.split(" ")[0]} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/settings" as any)}
            style={{
              padding: 8,
              backgroundColor: COLORS.bgSoft,
              borderRadius: 10,
            }}
          >
            <Feather name="settings" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: COLORS.bgSoft,
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              onPress={() => setActivePeriod(p.value)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor:
                  activePeriod === p.value ? COLORS.yellow : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: activePeriod === p.value ? COLORS.bg : COLORS.gray,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <ActivityIndicator color={COLORS.yellow} size="large" />
            <Text style={{ color: COLORS.gray, marginTop: 12, fontSize: 13 }}>
              Loading report...
            </Text>
          </View>
        )}

        {/* Error */}
        {isError && (
          <View
            style={{
              backgroundColor: COLORS.bgSoft,
              borderRadius: 12,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Feather name="wifi-off" size={32} color={COLORS.red} />
            <Text
              style={{ color: COLORS.fg, fontWeight: "600", marginTop: 12 }}
            >
              Failed to load report
            </Text>
            <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 4 }}>
              Pull down to retry
            </Text>
          </View>
        )}

        {/* Stat Cards */}
        {data && (
          <>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                margin: -4,
                marginBottom: 8,
              }}
            >
              <StatCard
                label="Revenue"
                value={formatKES(data.totalRevenue)}
                icon="trending-up"
                iconColor={COLORS.green}
                sub={`${data.totalTransactions} transactions`}
                subPositive
              />
              <StatCard
                label="Gross Profit"
                value={formatKES(data.grossProfit)}
                icon="dollar-sign"
                iconColor={COLORS.yellow}
                sub={`${profitMargin}% margin`}
                subPositive={Number(profitMargin) > 0}
              />
              <StatCard
                label="Cost of Goods"
                value={formatKES(data.totalCOGS)}
                icon="package"
                iconColor={COLORS.blue}
              />
              <StatCard
                label="Discounts Given"
                value={formatKES(data.totalDiscount)}
                icon="tag"
                iconColor={COLORS.red}
              />
            </View>

            {/* Top Products */}
            {data.topProductsJson.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.bgSoft,
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    color: COLORS.fg,
                    fontWeight: "700",
                    fontSize: 15,
                    marginBottom: 14,
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
                        index < data.topProductsJson.length - 1 ? 12 : 0,
                    }}
                  >
                    {/* Rank */}
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

                    {/* Name + Bar */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: COLORS.fg,
                          fontSize: 13,
                          fontWeight: "500",
                        }}
                      >
                        {product.name}
                      </Text>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: COLORS.bgHard,
                          borderRadius: 2,
                          marginTop: 4,
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

                    {/* Quantity */}
                    <Text
                      style={{
                        color: COLORS.gray,
                        fontSize: 12,
                        marginLeft: 12,
                        minWidth: 40,
                        textAlign: "right",
                      }}
                    >
                      {product.quantity} sold
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
