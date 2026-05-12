import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "../lib/stores/authStore";

export default function Index() {
  const { user, isLoading } = useAuthStore();

  // Still reading from SecureStore — show nothing
  if (isLoading) {
    return <View className="flex-1 bg-bg" />;
  }

  // Redirect based on auth state
  return <Redirect href={user ? "/(app)/dashboard" : "/(auth)/login"} />;
}