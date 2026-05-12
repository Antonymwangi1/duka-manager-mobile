import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#282828",
  bgSoft: "#32302f",
  yellow: "#fabd2f",
  gray: "#928374",
  fg: "#ebdbb2",
};

interface TabIconProps {
  focused: boolean;
  label: string;
  children: React.ReactNode;
}

function TabIcon({ focused, label, children }: TabIconProps) {
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
    <View style={{ alignItems: "center", justifyContent: "center" }}>
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
          marginBottom: 4,
        }}
      >
        <MaterialCommunityIcons
          name="point-of-sale"
          size={26}
          color={focused ? COLORS.bg : COLORS.gray}
        />
      </View>
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
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom || 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: COLORS.gray,
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
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
          title: "Inventory",
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
          title: "POS",
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
          title: "Reports",
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
          title: "Staff",
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
    </Tabs>
  );
}
