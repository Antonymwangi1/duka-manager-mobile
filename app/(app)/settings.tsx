import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import {
  useChangePassword,
  useShop,
  useUpdateProfile,
  useUpdateShop,
} from "../../hooks/useSettings";
import { useAuthStore } from "../../lib/stores/authStore";

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

// ── Schemas ──────────────────────────────────────────────────────
const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ShopSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  location: z.string().optional(),
  phone: z.string().optional(),
  defaultLowStockThreshold: z.coerce.number().int().positive(),
});

type ProfileForm = z.infer<typeof ProfileSchema>;
type PasswordForm = z.infer<typeof PasswordSchema>;
type ShopForm = z.infer<typeof ShopSchema>;

// ── Reusable Field ───────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          color: COLORS.gray,
          fontSize: 12,
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

// ── Section Header ───────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: COLORS.yellow,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
      }}
    >
      {title}
    </Text>
  );
}

// ── Setting Row (for simple tappable rows) ───────────────────────
function SettingRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bgSoft,
        borderRadius: 10,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: destructive ? COLORS.red + "20" : COLORS.bgHard,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Feather
          name={icon}
          size={16}
          color={destructive ? COLORS.red : COLORS.gray}
        />
      </View>
      <Text
        style={{
          flex: 1,
          color: destructive ? COLORS.red : COLORS.fg,
          fontSize: 14,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      {value && (
        <Text style={{ color: COLORS.gray, fontSize: 13, marginRight: 8 }}>
          {value}
        </Text>
      )}
      {!destructive && (
        <Feather name="chevron-right" size={16} color={COLORS.gray} />
      )}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, shopId, role, clearAuth, setAuth, token } = useAuthStore();
  const [activeSection, setActiveSection] = useState<
    "main" | "profile" | "password" | "shop"
  >("main");

  const isOwner = role === "OWNER";

  const { data: shop, isLoading: shopLoading } = useShop(shopId);
  const updateShopMutation = useUpdateShop(shopId!);
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const inputStyle = {
    backgroundColor: COLORS.bgHard,
    color: COLORS.fg,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.gray + "30",
  };

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema) as Resolver<ProfileForm>,
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  // Password form
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema) as Resolver<PasswordForm>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Shop form
  const shopForm = useForm<ShopForm>({
    resolver: zodResolver(ShopSchema) as Resolver<ShopForm>,
  });

  useEffect(() => {
    if (shop) {
      shopForm.reset({
        name: shop.name,
        location: shop.location ?? "",
        phone: shop.phone ?? "",
        defaultLowStockThreshold: shop.defaultLowStockThreshold,
      });
    }
  }, [shop]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            // Tell the server to invalidate the session
            // Your logout route clears the httpOnly cookie on web
            // On mobile we just clear local storage
          } catch {}
          await clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleProfileSave = async (data: ProfileForm) => {
    try {
      const updated = await updateProfileMutation.mutateAsync(data);
      // Update the auth store with new user details
      setAuth(token!, updated, shopId!, role!, "");
      Alert.alert("Success", "Profile updated successfully.");
      setActiveSection("main");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ?? "Failed to update profile",
      );
    }
  };

  const handlePasswordSave = async (data: PasswordForm) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      Alert.alert("Success", "Password changed successfully.", [
        { text: "OK", onPress: () => setActiveSection("main") },
      ]);
      passwordForm.reset();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ?? "Failed to change password",
      );
    }
  };

  const handleShopSave = async (data: ShopForm) => {
    try {
      await updateShopMutation.mutateAsync(data);
      Alert.alert("Success", "Shop settings updated.", [
        { text: "OK", onPress: () => setActiveSection("main") },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ?? "Failed to update shop settings",
      );
    }
  };

  // ── Render Sections ───────────────────────────────────────────
  const renderMain = () => (
    <>
      {/* User Info Card */}
      <View
        style={{
          backgroundColor: COLORS.bgSoft,
          borderRadius: 14,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: COLORS.yellow + "25",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            borderWidth: 1,
            borderColor: COLORS.yellow + "50",
          }}
        >
          <Text
            style={{ color: COLORS.yellow, fontWeight: "700", fontSize: 20 }}
          >
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.fg, fontWeight: "700", fontSize: 16 }}>
            {user?.name}
          </Text>
          <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 2 }}>
            {user?.email}
          </Text>
          <View
            style={{
              backgroundColor: COLORS.yellow + "20",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: COLORS.yellow,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {role}
            </Text>
          </View>
        </View>
      </View>

      <SectionHeader title="ACCOUNT" />
      <SettingRow
        icon="user"
        label="Edit Profile"
        onPress={() => setActiveSection("profile")}
      />
      <SettingRow
        icon="lock"
        label="Change Password"
        onPress={() => setActiveSection("password")}
      />

      {isOwner && (
        <>
          <SectionHeader title="SHOP" />
          <SettingRow
            icon="shopping-bag"
            label="Shop Settings"
            value={shop?.name}
            onPress={() => setActiveSection("shop")}
          />
        </>
      )}

      <SectionHeader title="APP" />
      <SettingRow
        icon="info"
        label="Version"
        value="1.0.0"
        onPress={() => {}}
      />

      <View style={{ marginTop: 8 }}>
        <SettingRow
          icon="log-out"
          label="Sign Out"
          onPress={handleLogout}
          destructive
        />
      </View>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title="EDIT PROFILE" />
      <View
        style={{
          backgroundColor: COLORS.bgSoft,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <Field
          label="Full Name"
          error={profileForm.formState.errors.name?.message}
        >
          <Controller
            control={profileForm.control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Your name"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>
        <Field label="Phone (optional)">
          <Controller
            control={profileForm.control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ""}
                placeholder="e.g. 0712345678"
                placeholderTextColor={COLORS.gray}
                keyboardType="phone-pad"
              />
            )}
          />
        </Field>
      </View>

      <TouchableOpacity
        onPress={profileForm.handleSubmit(handleProfileSave)}
        disabled={profileForm.formState.isSubmitting}
        style={{
          backgroundColor: profileForm.formState.isSubmitting
            ? COLORS.yellow + "50"
            : COLORS.yellow,
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        {profileForm.formState.isSubmitting ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}>
            Save Profile
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderPassword = () => (
    <>
      <SectionHeader title="CHANGE PASSWORD" />
      <View
        style={{
          backgroundColor: COLORS.bgSoft,
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <Field
          label="Current Password"
          error={passwordForm.formState.errors.currentPassword?.message}
        >
          <Controller
            control={passwordForm.control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>
        <Field
          label="New Password"
          error={passwordForm.formState.errors.newPassword?.message}
        >
          <Controller
            control={passwordForm.control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                placeholder="Min 8 characters"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>
        <Field
          label="Confirm New Password"
          error={passwordForm.formState.errors.confirmPassword?.message}
        >
          <Controller
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>
      </View>

      <TouchableOpacity
        onPress={passwordForm.handleSubmit(handlePasswordSave)}
        disabled={passwordForm.formState.isSubmitting}
        style={{
          backgroundColor: passwordForm.formState.isSubmitting
            ? COLORS.yellow + "50"
            : COLORS.yellow,
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        {passwordForm.formState.isSubmitting ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}>
            Change Password
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderShop = () => (
    <>
      <SectionHeader title="SHOP SETTINGS" />
      {shopLoading ? (
        <ActivityIndicator color={COLORS.yellow} />
      ) : (
        <>
          <View
            style={{
              backgroundColor: COLORS.bgSoft,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Field
              label="Shop Name"
              error={shopForm.formState.errors.name?.message}
            >
              <Controller
                control={shopForm.control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Your shop name"
                    placeholderTextColor={COLORS.gray}
                  />
                )}
              />
            </Field>
            <Field label="Location (optional)">
              <Controller
                control={shopForm.control}
                name="location"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ""}
                    placeholder="e.g. Nairobi, Westlands"
                    placeholderTextColor={COLORS.gray}
                  />
                )}
              />
            </Field>
            <Field label="Shop Phone (optional)">
              <Controller
                control={shopForm.control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value ?? ""}
                    placeholder="e.g. 0712345678"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="phone-pad"
                  />
                )}
              />
            </Field>
            <Field
              label="Low Stock Threshold"
              error={
                shopForm.formState.errors.defaultLowStockThreshold?.message
              }
            >
              <Controller
                control={shopForm.control}
                name="defaultLowStockThreshold"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")}
                    placeholder="e.g. 10"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                  />
                )}
              />
            </Field>

            {/* Read-only info */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: COLORS.bgHard,
              }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Plan</Text>
              <Text
                style={{ color: COLORS.blue, fontSize: 13, fontWeight: "600" }}
              >
                {shop?.plan}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Currency</Text>
              <Text style={{ color: COLORS.fg, fontSize: 13 }}>
                {shop?.currency}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={shopForm.handleSubmit(handleShopSave)}
            disabled={shopForm.formState.isSubmitting}
            style={{
              backgroundColor: shopForm.formState.isSubmitting
                ? COLORS.yellow + "50"
                : COLORS.yellow,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            {shopForm.formState.isSubmitting ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text
                style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}
              >
                Save Shop Settings
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (activeSection === "main") {
              router.back();
            } else {
              setActiveSection("main");
            }
          }}
          style={{
            padding: 8,
            backgroundColor: COLORS.bgSoft,
            borderRadius: 8,
          }}
        >
          <Feather name="arrow-left" size={18} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.fg, fontSize: 20, fontWeight: "700" }}>
          {activeSection === "main"
            ? "Settings"
            : activeSection === "profile"
              ? "Edit Profile"
              : activeSection === "password"
                ? "Change Password"
                : "Shop Settings"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {activeSection === "main" && renderMain()}
        {activeSection === "profile" && renderProfile()}
        {activeSection === "password" && renderPassword()}
        {activeSection === "shop" && renderShop()}
      </ScrollView>
    </View>
  );
}
