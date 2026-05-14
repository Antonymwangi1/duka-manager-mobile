import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { apiClient } from "../../lib/api/client";
import { useAuthStore } from "../../lib/stores/authStore";

const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function Login() {
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (formData: LoginFormData) => {
    setApiError(null);
    try {
      const { data: res } = await apiClient.post(
        "/api/mobile/auth/login",
        formData,
      );

      if (!res.success) {
        setApiError(res.error);
        return;
      }

      const { accessToken, refreshToken, user, shopId, role } = res.data;
      await setAuth(accessToken, user, shopId, role, refreshToken);

      router.replace("/(app)/dashboard");
    } catch (error: any) {
      setApiError(
        error.response?.data?.error ?? "Network error — check your connection",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-10">
            <Text className="text-yellow text-4xl font-bold mb-1">Duka</Text>
            <Text className="text-fg text-4xl font-bold">Manager</Text>
            <Text className="text-gray text-sm mt-3">
              Sign in to manage your shop
            </Text>
          </View>

          {/* API Error */}
          {apiError && (
            <View className="bg-red/20 border border-red rounded-lg px-4 py-3 mb-6">
              <Text className="text-red text-sm">{apiError}</Text>
            </View>
          )}

          {/* Email Field */}
          <View className="mb-5">
            <Text className="text-fg text-sm font-medium mb-2">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-bg-soft text-fg px-4 py-3 rounded-lg border ${
                    errors.email ? "border-red" : "border-gray/30"
                  }`}
                  placeholder="you@example.com"
                  placeholderTextColor="#928374"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Password Field */}
          <View className="mb-8">
            <Text className="text-fg text-sm font-medium mb-2">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`bg-bg-soft text-fg px-4 py-3 rounded-lg border ${
                    errors.password ? "border-red" : "border-gray/30"
                  }`}
                  placeholder="••••••••"
                  placeholderTextColor="#928374"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text className="text-red text-xs mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`py-4 rounded-lg items-center ${
              isSubmitting ? "bg-yellow/50" : "bg-yellow"
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#282828" />
            ) : (
              <Text className="text-bg font-bold text-base">Sign In</Text>
            )}
          </TouchableOpacity>
          {/* Register Link */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text style={{ color: "#928374", fontSize: 14 }}>
              Don't have an account?{" "}
              <Text style={{ color: "#FBBF24", fontWeight: "600" }}>
                Create one
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
