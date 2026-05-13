import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api/client";
import { useAuthStore } from "../../../lib/stores/authStore";
import { useUpdateProduct } from "../../../hooks/useInventory";

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

const UpdateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  buyingPrice: z.coerce.number().positive("Must be positive"),
  sellingPrice: z.coerce.number().positive("Must be positive"),
  stockQty: z.coerce.number().nonnegative("Cannot be negative"),
});

type FormData = z.infer<typeof UpdateProductSchema>;

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: COLORS.fg, fontSize: 13, fontWeight: "500", marginBottom: 6 }}>
        {label}
      </Text>
      {children}
      {error && (
        <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}

export default function EditProduct() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shopId } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/inventory/${id}`, {
        params: { shopId },
      });
      return data.data.product;
    },
    enabled: !!id && !!shopId,
  });

  const updateMutation = useUpdateProduct(shopId!, id!);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(UpdateProductSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        sku: data.sku ?? "",
        unit: data.unit,
        buyingPrice: data.buyingPrice,
        sellingPrice: data.sellingPrice,
        stockQty: data.stockQty,
      });
    }
  }, [data]);

  const onSubmit = async (formData: FormData) => {
    try {
      await updateMutation.mutateAsync(formData);
      Alert.alert("Success", "Product updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error ?? "Failed to update product");
    }
  };

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.yellow} size="large" />
      </View>
    );
  }

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
          onPress={() => router.back()}
          style={{
            padding: 8,
            backgroundColor: COLORS.bgSoft,
            borderRadius: 8,
          }}
        >
          <Feather name="arrow-left" size={18} color={COLORS.fg} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.fg, fontSize: 20, fontWeight: "700" }}>
          Edit Product
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Product Name" error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. Unga Jogoo 2kg"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>

        <Field label="SKU (optional)" error={errors.sku?.message}>
          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. UJ-2KG"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="characters"
              />
            )}
          />
        </Field>

        <Field label="Unit" error={errors.unit?.message}>
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="e.g. kg, pcs, litres"
                placeholderTextColor={COLORS.gray}
              />
            )}
          />
        </Field>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Buying Price (KES)" error={errors.buyingPrice?.message}>
              <Controller
                control={control}
                name="buyingPrice"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.gray}
                    placeholder="0"
                  />
                )}
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Selling Price (KES)" error={errors.sellingPrice?.message}>
              <Controller
                control={control}
                name="sellingPrice"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={inputStyle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")}
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.gray}
                    placeholder="0"
                  />
                )}
              />
            </Field>
          </View>
        </View>

        <Field label="Stock Quantity" error={errors.stockQty?.message}>
          <Controller
            control={control}
            name="stockQty"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={inputStyle}
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value ?? "")}
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray}
                placeholder="0"
              />
            )}
          />
        </Field>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !isDirty}
          style={{
            backgroundColor:
              isSubmitting || !isDirty ? COLORS.yellow + "50" : COLORS.yellow,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}