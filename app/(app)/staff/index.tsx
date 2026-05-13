import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useState } from "react";
import { Controller, Resolver, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import {
  useCreateStaff,
  useRemoveStaff,
  useStaff,
} from "../../../hooks/useStaff";
import { StaffMember, StaffRole } from "../../../lib/api/staff";
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

const ROLE_COLORS: Record<StaffRole, string> = {
  OWNER: COLORS.yellow,
  MANAGER: COLORS.blue,
  CASHIER: COLORS.green,
};

const CreateStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["MANAGER", "CASHIER"]),
});

type CreateStaffForm = z.infer<typeof CreateStaffSchema>;

// ── Staff Card ───────────────────────────────────────────────────
function StaffCard({
  member,
  isCurrentUser,
  canManage,
  onRemove,
}: {
  member: StaffMember;
  isCurrentUser: boolean;
  canManage: boolean;
  onRemove: () => void;
}) {
  const initials = member.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={{
        backgroundColor: COLORS.bgSoft,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: ROLE_COLORS[member.role] + "25",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          borderWidth: 1,
          borderColor: ROLE_COLORS[member.role] + "50",
        }}
      >
        <Text
          style={{
            color: ROLE_COLORS[member.role],
            fontWeight: "700",
            fontSize: 15,
          }}
        >
          {initials}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: COLORS.fg, fontWeight: "600", fontSize: 15 }}>
            {member.user.name}
          </Text>
          {isCurrentUser && (
            <View
              style={{
                backgroundColor: COLORS.yellow + "25",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  color: COLORS.yellow,
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                You
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 2 }}>
          {member.user.email}
        </Text>
        {member.user.phone && (
          <Text style={{ color: COLORS.gray, fontSize: 12 }}>
            {member.user.phone}
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
          }}
        >
          <View
            style={{
              backgroundColor: ROLE_COLORS[member.role] + "20",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: ROLE_COLORS[member.role],
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {member.role}
            </Text>
          </View>
          <Text style={{ color: COLORS.gray, fontSize: 11 }}>
            Joined {format(new Date(member.joinedAt), "d MMM yyyy")}
          </Text>
        </View>
      </View>

      {/* Remove button — hidden for owner and current user */}
      {canManage && !isCurrentUser && member.role !== "OWNER" && (
        <TouchableOpacity
          onPress={onRemove}
          style={{
            padding: 8,
            backgroundColor: COLORS.bgHard,
            borderRadius: 8,
          }}
        >
          <Feather name="user-minus" size={16} color={COLORS.red} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Add Staff Modal ──────────────────────────────────────────────
function AddStaffModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffForm) => Promise<void>;
}) {
  const [selectedRole, setSelectedRole] = useState<"MANAGER" | "CASHIER">(
    "CASHIER",
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffForm>({
    resolver: zodResolver(CreateStaffSchema) as Resolver<CreateStaffForm>,
    defaultValues: { role: "CASHIER" },
  });

  const handleClose = () => {
    reset();
    setSelectedRole("CASHIER");
    onClose();
  };

  const handleConfirm = async (data: CreateStaffForm) => {
    await onSubmit(data);
    handleClose();
  };

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.bgSoft,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: COLORS.gray,
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            <Text
              style={{
                color: COLORS.fg,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 20,
              }}
            >
              Add Staff Member
            </Text>

            {/* Name */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Full Name
              </Text>
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
              {errors.name && (
                <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4 }}>
                  {errors.name.message}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    placeholder="email@example.com"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && (
                <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Phone (optional)
              </Text>
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
            </View>

            {/* Password */}
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Password
              </Text>
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
              {errors.password && (
                <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Role */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 8 }}
              >
                Role
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(["CASHIER", "MANAGER"] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => {
                      setSelectedRole(role);
                      setValue("role", role);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: "center",
                      backgroundColor:
                        selectedRole === role
                          ? ROLE_COLORS[role] + "25"
                          : COLORS.bgHard,
                      borderWidth: 1,
                      borderColor:
                        selectedRole === role
                          ? ROLE_COLORS[role]
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedRole === role
                            ? ROLE_COLORS[role]
                            : COLORS.gray,
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit(handleConfirm)}
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting
                  ? COLORS.yellow + "50"
                  : COLORS.yellow,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text
                  style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}
                >
                  Add Staff Member
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              style={{ alignItems: "center" }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function Staff() {
  const insets = useSafeAreaInsets();
  const { shopId, user, role } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage = role === "OWNER" || role === "MANAGER";

  const {
    data: staff,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useStaff(shopId);

  const createMutation = useCreateStaff(shopId!);
  const removeMutation = useRemoveStaff(shopId!);

  const handleAdd = async (data: CreateStaffForm) => {
    try {
      await createMutation.mutateAsync(data);
      Alert.alert("Success", "Staff member added successfully.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error ?? "Failed to add staff member",
      );
      throw error; // Re-throw so modal stays open on error
    }
  };

  const handleRemove = (member: StaffMember) => {
    Alert.alert(
      "Remove Staff",
      `Are you sure you want to remove ${member.user.name} from your shop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            removeMutation.mutate(member.id, {
              onError: (error: any) => {
                Alert.alert(
                  "Error",
                  error.response?.data?.error ??
                    "Failed to remove staff member",
                );
              },
            }),
        },
      ],
    );
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ color: COLORS.fg, fontSize: 22, fontWeight: "700" }}>
              Staff
            </Text>
            {staff && (
              <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 2 }}>
                {staff.length} member{staff.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {canManage && (
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.yellow,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                gap: 6,
              }}
            >
              <Feather name="user-plus" size={16} color={COLORS.bg} />
              <Text
                style={{
                  color: COLORS.bg,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Add
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={COLORS.yellow} size="large" />
          <Text style={{ color: COLORS.gray, marginTop: 12, fontSize: 13 }}>
            Loading staff...
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
            Failed to load staff
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
          {/* Role Legend */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {(["OWNER", "MANAGER", "CASHIER"] as StaffRole[]).map((r) => (
              <View
                key={r}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: ROLE_COLORS[r],
                  }}
                />
                <Text style={{ color: COLORS.gray, fontSize: 12 }}>{r}</Text>
              </View>
            ))}
          </View>

          {staff && staff.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Feather name="users" size={40} color={COLORS.gray} />
              <Text
                style={{
                  color: COLORS.fg,
                  fontWeight: "600",
                  marginTop: 16,
                  fontSize: 16,
                }}
              >
                No staff yet
              </Text>
              <Text
                style={{
                  color: COLORS.gray,
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Tap Add to invite your first staff member
              </Text>
            </View>
          ) : (
            staff?.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                isCurrentUser={member.user.id === user?.id}
                canManage={canManage}
                onRemove={() => handleRemove(member)}
              />
            ))
          )}
        </ScrollView>
      )}

      <AddStaffModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAdd}
      />
    </View>
  );
}
