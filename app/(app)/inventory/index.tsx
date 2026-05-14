import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeleteProduct, useProducts } from "../../../hooks/useInventory";
import { Product } from "../../../lib/api/inventory";
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
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  canManage?: boolean;
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  canManage,
}: ProductCardProps) {
  const isLowStock =
    product.lowStockThreshold !== undefined &&
    product.stockQty <= product.lowStockThreshold;
  const isOutOfStock = product.stockQty === 0;

  const stockColor = isOutOfStock
    ? COLORS.red
    : isLowStock
      ? COLORS.yellow
      : COLORS.green;

  const stockLabel = isOutOfStock
    ? "Out of stock"
    : isLowStock
      ? "Low stock"
      : "In stock";

  return (
    <View
      style={{
        backgroundColor: COLORS.bgSoft,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: stockColor,
      }}
    >
      {/* Top Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: COLORS.fg, fontWeight: "700", fontSize: 15 }}>
            {product.name}
          </Text>
          {product.sku && (
            <Text style={{ color: COLORS.gray, fontSize: 11, marginTop: 2 }}>
              SKU: {product.sku}
            </Text>
          )}
          {product.category && (
            <Text style={{ color: COLORS.blue, fontSize: 11, marginTop: 1 }}>
              {product.category}
            </Text>
          )}
        </View>

        {/* Actions */}
        {canManage && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={onEdit}
              style={{
                padding: 6,
                backgroundColor: COLORS.bgHard,
                borderRadius: 8,
              }}
            >
              <Feather name="edit-2" size={14} color={COLORS.blue} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={{
                padding: 6,
                backgroundColor: COLORS.bgHard,
                borderRadius: 8,
              }}
            >
              <Feather name="trash-2" size={14} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <View>
          <Text style={{ color: COLORS.gray, fontSize: 11 }}>
            Selling Price
          </Text>
          <Text
            style={{ color: COLORS.yellow, fontWeight: "700", fontSize: 14 }}
          >
            {formatKES(product.sellingPrice)}
          </Text>
        </View>
        <View>
          <Text style={{ color: COLORS.gray, fontSize: 11 }}>Buying Price</Text>
          <Text style={{ color: COLORS.fg, fontWeight: "600", fontSize: 14 }}>
            {formatKES(product.buyingPrice)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: COLORS.gray, fontSize: 11 }}>Stock</Text>
          <Text style={{ color: stockColor, fontWeight: "700", fontSize: 14 }}>
            {product.stockQty} {product.unit}
          </Text>
          <Text style={{ color: stockColor, fontSize: 10 }}>{stockLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function Inventory() {
  const insets = useSafeAreaInsets();
  const { shopId, role } = useAuthStore();
  const [search, setSearch] = useState("");

  const canManage = role === "OWNER" || role === "MANAGER";

  const {
    data: products,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useProducts(shopId);

  const deleteMutation = useDeleteProduct(shopId!);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const lowStockCount = useMemo(() => {
    if (!products) return 0;
    return products.filter(
      (p) =>
        p.lowStockThreshold !== undefined && p.stockQty <= p.lowStockThreshold,
    ).length;
  }, [products]);

  const handleDelete = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(product.id),
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
              Inventory
            </Text>
            {products && (
              <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 2 }}>
                {products.length} products
                {lowStockCount > 0 && (
                  <Text style={{ color: COLORS.yellow }}>
                    {" "}
                    · {lowStockCount} low stock
                  </Text>
                )}
              </Text>
            )}
          </View>

          {/* Add Button */}
          {canManage && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/inventory/add")}
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
              <Feather name="plus" size={16} color={COLORS.bg} />
              <Text
                style={{ color: COLORS.bg, fontWeight: "700", fontSize: 13 }}
              >
                Add
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.bgSoft,
            borderRadius: 10,
            paddingHorizontal: 12,
            marginTop: 14,
            gap: 8,
          }}
        >
          <Feather name="search" size={16} color={COLORS.gray} />
          <TextInput
            style={{
              flex: 1,
              color: COLORS.fg,
              paddingVertical: 10,
              fontSize: 14,
            }}
            placeholder="Search by name, SKU, category..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={COLORS.yellow} size="large" />
          <Text style={{ color: COLORS.gray, marginTop: 12, fontSize: 13 }}>
            Loading inventory...
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
            Failed to load inventory
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
            paddingBottom: 24,
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
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Feather name="package" size={40} color={COLORS.gray} />
              <Text
                style={{
                  color: COLORS.fg,
                  fontWeight: "600",
                  marginTop: 16,
                  fontSize: 16,
                }}
              >
                {search ? "No products found" : "No products yet"}
              </Text>
              <Text
                style={{
                  color: COLORS.gray,
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {search
                  ? "Try a different search term"
                  : "Tap Add to create your first product"}
              </Text>
            </View>
          ) : (
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                canManage={canManage}
                onEdit={() =>
                  router.push({
                    pathname: "/(app)/inventory/[id]",
                    params: { id: product.id },
                  })
                }
                onDelete={() => handleDelete(product)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
