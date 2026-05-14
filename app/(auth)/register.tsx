import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { router } from "expo-router";
import { useState } from "react";
import { apiClient } from "../../lib/api/client";

const COLORS = {
  bg: "#282828",
  bgSoft: "#32302f",
  fg: "#ebdbb2",
  yellow: "#fabd2f",
  red: "#fb4934",
  gray: "#928374",
};

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    shopName: z.string().min(1, "Shop name is required"),
    shopPhone: z.string().optional(),
    location: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof RegisterSchema>;

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: COLORS.fg,
          fontSize: 13,
          fontWeight: "500",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {children}
      {error && (
        <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

export default function Register() {
  const [apiError, setApiError] = useState<string | null>(null);

  const inputStyle = {
    backgroundColor: COLORS.bgSoft,
    color: COLORS.fg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.gray + "30",
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      shopName: "",
      shopPhone: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formData: FormData) => {
    setApiError(null);
    try {
      const { data } = await apiClient.post("/api/auth/register", formData);
      if (!data.success) {
        setApiError(data.error);
        return;
      }
      router.replace("/(auth)/login");
    } catch (error: any) {
      setApiError(
        error.response?.data?.error ?? "Network error — check your connection"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48 }}>
          {/* Header */}
          <View style={{ marginBottom: 28 }}>
            <Text style={{ color: COLORS.yellow, fontSize: 32, fontWeight: "700" }}>
              Duka
            </Text>
            <Text style={{ color: COLORS.fg, fontSize: 32, fontWeight: "700" }}>
              Manager
            </Text>
            <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 6 }}>
              Create your shop account
            </Text>
          </View>

          {/* API Error */}
          {apiError && (
            <View
              style={{
                backgroundColor: COLORS.red + "20",
                borderWidth: 1,
                borderColor: COLORS.red,
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: COLORS.red, fontSize: 13 }}>{apiError}</Text>
            </View>
          )}

          {/* Section: Personal Info */}
          <Text
            style={{
              color: COLORS.yellow,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            YOUR DETAILS
          </Text>

          <Field label="Full Name" error={errors.name?.message}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. John Kamau"
                  placeholderTextColor={COLORS.gray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Phone (optional)" error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 0712345678"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          {/* Section: Shop Info */}
          <Text
            style={{
              color: COLORS.yellow,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
              marginTop: 8,
            }}
          >
            SHOP DETAILS
          </Text>

          <Field label="Shop Name" error={errors.shopName?.message}>
            <Controller
              control={control}
              name="shopName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Kamau General Store"
                  placeholderTextColor={COLORS.gray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Shop Phone (optional)" error={errors.shopPhone?.message}>
            <Controller
              control={control}
              name="shopPhone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 0712345678"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Location (optional)" error={errors.location?.message}>
            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. Nairobi, Westlands"
                  placeholderTextColor={COLORS.gray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          {/* Section: Password */}
          <Text
            style={{
              color: COLORS.yellow,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
              marginTop: 8,
            }}
          >
            PASSWORD
          </Text>

          <Field label="Password" error={errors.password?.message}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="Min 8 characters"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword?.message}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle}
                  placeholder="Repeat your password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting
                ? COLORS.yellow + "50"
                : COLORS.yellow,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text
                style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}
              >
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: COLORS.gray, fontSize: 14 }}>
              Already have an account?{" "}
              <Text style={{ color: COLORS.yellow, fontWeight: "600" }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}