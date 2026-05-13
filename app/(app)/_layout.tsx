import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function TabIcon({
  focused,
  label,
  children,
}: {
  focused: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 6,
        width: 70,
      }}
    >
      {children}
      <Text
        style={{
          fontSize: 11,
          marginTop: 4,
          color: focused ? COLORS.yellow : COLORS.gray,
          fontWeight: focused ? "600" : "400",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function POSIcon({ focused }: { focused: boolean }) {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: focused ? COLORS.yellow : COLORS.bgSoft,
        borderWidth: 2,
        borderColor: focused ? COLORS.yellow : COLORS.gray,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialCommunityIcons
        name="point-of-sale"
        size={26}
        color={focused ? COLORS.bg : COLORS.gray}
      />
    </View>
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSoft,
          borderTopColor: COLORS.gray + "30",
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: COLORS.gray,
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Dashboard">
              <Feather
                name="home"
                size={22}
                color={focused ? COLORS.yellow : COLORS.gray}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Inventory">
              <Feather
                name="box"
                size={22}
                color={focused ? COLORS.yellow : COLORS.gray}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="pos/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="POS">
              <POSIcon focused={focused} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Reports">
              <Feather
                name="bar-chart-2"
                size={22}
                color={focused ? COLORS.yellow : COLORS.gray}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="staff/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Staff">
              <Feather
                name="users"
                size={22}
                color={focused ? COLORS.yellow : COLORS.gray}
              />
            </TabIcon>
          ),
        }}
      />

      {/* Hide non-tab screens from tab bar */}
      <Tabs.Screen name="inventory/add" options={{ href: null }} />
      <Tabs.Screen name="inventory/[id]" options={{ href: null }} />
    </Tabs>
  );
}
