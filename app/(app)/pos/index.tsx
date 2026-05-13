import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "../../../hooks/useInventory";
import { Product } from "../../../lib/api/inventory";
import {
  createSale,
  PaymentMethod,
  SaleResponse,
} from "../../../lib/api/sales";
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
  return `KES ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ── Cart Item Type ───────────────────────────────────────────────
interface CartItem {
  product: Product;
  quantity: number;
}

// ── Product Card for search results ─────────────────────────────
function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  const outOfStock = product.stockQty === 0;
  return (
    <TouchableOpacity
      onPress={onAdd}
      disabled={outOfStock}
      style={{
        backgroundColor: COLORS.bgSoft,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        opacity: outOfStock ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.fg, fontWeight: "600", fontSize: 14 }}>
          {product.name}
        </Text>
        <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 2 }}>
          Stock: {product.stockQty} {product.unit}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
        <Text style={{ color: COLORS.yellow, fontWeight: "700", fontSize: 14 }}>
          {formatKES(product.sellingPrice)}
        </Text>
        {outOfStock ? (
          <Text style={{ color: COLORS.red, fontSize: 11 }}>Out of stock</Text>
        ) : (
          <View
            style={{
              marginTop: 4,
              backgroundColor: COLORS.yellow,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: COLORS.bg, fontSize: 11, fontWeight: "700" }}>
              + Add
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Cart Item Row ────────────────────────────────────────────────
function CartRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  const lineTotal = item.product.sellingPrice * item.quantity;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bgHard,
      }}
    >
      {/* Remove */}
      <TouchableOpacity onPress={onRemove} style={{ marginRight: 10 }}>
        <Feather name="x" size={16} color={COLORS.red} />
      </TouchableOpacity>

      {/* Name */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.fg, fontSize: 13, fontWeight: "500" }}>
          {item.product.name}
        </Text>
        <Text style={{ color: COLORS.gray, fontSize: 11 }}>
          {formatKES(item.product.sellingPrice)} each
        </Text>
      </View>

      {/* Quantity Controls */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={onDecrement}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: COLORS.bgHard,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="minus" size={14} color={COLORS.fg} />
        </TouchableOpacity>
        <Text
          style={{
            color: COLORS.fg,
            fontWeight: "700",
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {item.quantity}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={item.quantity >= item.product.stockQty}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor:
              item.quantity >= item.product.stockQty
                ? COLORS.bgHard
                : COLORS.yellow,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather
            name="plus"
            size={14}
            color={
              item.quantity >= item.product.stockQty ? COLORS.gray : COLORS.bg
            }
          />
        </TouchableOpacity>
      </View>

      {/* Line Total */}
      <Text
        style={{
          color: COLORS.yellow,
          fontWeight: "700",
          fontSize: 13,
          minWidth: 70,
          textAlign: "right",
          marginLeft: 8,
        }}
      >
        {formatKES(lineTotal)}
      </Text>
    </View>
  );
}

// ── Checkout Modal ───────────────────────────────────────────────
function CheckoutModal({
  visible,
  subtotal,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  subtotal: number;
  onClose: () => void;
  onConfirm: (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    discount: number,
    mpesaRef?: string,
  ) => Promise<void>;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [mpesaRef, setMpesaRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const discountNum = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountNum);
  const amountPaidNum = Number(amountPaid) || 0;
  const change = Math.max(0, amountPaidNum - total);
  const canConfirm = amountPaidNum >= total && total > 0;

  const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
    { label: "Cash", value: "CASH" },
    { label: "M-Pesa", value: "MPESA" },
    { label: "Card", value: "CARD" },
    { label: "Credit", value: "CREDIT" },
  ];

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsProcessing(true);
    try {
      await onConfirm(
        paymentMethod,
        amountPaidNum,
        discountNum,
        mpesaRef || undefined,
      );
    } finally {
      setIsProcessing(false);
    }
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
              Checkout
            </Text>

            {/* Payment Method */}
            <Text style={{ color: COLORS.gray, fontSize: 12, marginBottom: 8 }}>
              Payment Method
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity
                  key={pm.value}
                  onPress={() => setPaymentMethod(pm.value)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor:
                      paymentMethod === pm.value
                        ? COLORS.yellow
                        : COLORS.bgHard,
                  }}
                >
                  <Text
                    style={{
                      color:
                        paymentMethod === pm.value ? COLORS.bg : COLORS.gray,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* M-Pesa Ref */}
            {paymentMethod === "MPESA" && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
                >
                  M-Pesa Reference
                </Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. QJK7XT1234"
                  placeholderTextColor={COLORS.gray}
                  value={mpesaRef}
                  onChangeText={setMpesaRef}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {/* Discount */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Discount (KES)
              </Text>
              <TextInput
                style={inputStyle}
                placeholder="0"
                placeholderTextColor={COLORS.gray}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
              />
            </View>

            {/* Amount Paid */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{ color: COLORS.gray, fontSize: 12, marginBottom: 6 }}
              >
                Amount Paid (KES)
              </Text>
              <TextInput
                style={{
                  ...inputStyle,
                  borderColor:
                    amountPaidNum > 0 && amountPaidNum < total
                      ? COLORS.red
                      : COLORS.gray + "30",
                }}
                placeholder="0"
                placeholderTextColor={COLORS.gray}
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="numeric"
              />
            </View>

            {/* Totals Summary */}
            <View
              style={{
                backgroundColor: COLORS.bgHard,
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: COLORS.gray, fontSize: 13 }}>
                  Subtotal
                </Text>
                <Text style={{ color: COLORS.fg, fontSize: 13 }}>
                  {formatKES(subtotal)}
                </Text>
              </View>
              {discountNum > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: COLORS.gray, fontSize: 13 }}>
                    Discount
                  </Text>
                  <Text style={{ color: COLORS.red, fontSize: 13 }}>
                    -{formatKES(discountNum)}
                  </Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderTopColor: COLORS.gray + "30",
                  paddingTop: 8,
                }}
              >
                <Text
                  style={{ color: COLORS.fg, fontWeight: "700", fontSize: 15 }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    color: COLORS.yellow,
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  {formatKES(total)}
                </Text>
              </View>
              {amountPaidNum >= total && amountPaidNum > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: COLORS.gray, fontSize: 13 }}>
                    Change
                  </Text>
                  <Text
                    style={{
                      color: COLORS.green,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {formatKES(change)}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!canConfirm || isProcessing}
              style={{
                backgroundColor:
                  !canConfirm || isProcessing
                    ? COLORS.yellow + "50"
                    : COLORS.yellow,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text
                  style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}
                >
                  Confirm Sale — {formatKES(total)}
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={onClose}
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

// ── Receipt Modal ────────────────────────────────────────────────
function ReceiptModal({
  visible,
  sale,
  onClose,
}: {
  visible: boolean;
  sale: SaleResponse | null;
  onClose: () => void;
}) {
  if (!sale) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.7)",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.bgSoft,
            borderRadius: 16,
            padding: 24,
            width: "100%",
          }}
        >
          {/* Success Icon */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: COLORS.green + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Feather name="check" size={28} color={COLORS.green} />
            </View>
            <Text style={{ color: COLORS.fg, fontWeight: "700", fontSize: 18 }}>
              Sale Complete
            </Text>
            <Text style={{ color: COLORS.gray, fontSize: 12, marginTop: 4 }}>
              {sale.receiptNumber}
            </Text>
          </View>

          {/* Items */}
          <View
            style={{
              backgroundColor: COLORS.bgHard,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            {sale.items.map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: i < sale.items.length - 1 ? 8 : 0,
                }}
              >
                <Text style={{ color: COLORS.fg, fontSize: 13 }}>
                  {item.product.name} × {item.quantity}
                </Text>
                <Text style={{ color: COLORS.fg, fontSize: 13 }}>
                  {formatKES(Number(item.lineTotal))}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={{ gap: 6, marginBottom: 20 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Total</Text>
              <Text
                style={{
                  color: COLORS.yellow,
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                {formatKES(Number(sale.total))}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Paid</Text>
              <Text style={{ color: COLORS.fg, fontSize: 13 }}>
                {formatKES(Number(sale.amountPaid))}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Change</Text>
              <Text
                style={{ color: COLORS.green, fontWeight: "600", fontSize: 13 }}
              >
                {formatKES(Number(sale.change))}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: COLORS.gray, fontSize: 13 }}>Method</Text>
              <Text style={{ color: COLORS.blue, fontSize: 13 }}>
                {sale.paymentMethod}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: COLORS.yellow,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.bg, fontWeight: "700", fontSize: 15 }}>
              New Sale
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main POS Screen ──────────────────────────────────────────────
export default function POS() {
  const insets = useSafeAreaInsets();
  const { shopId } = useAuthStore();
  const { data: products } = useProducts(shopId);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "cart">("products");

  // Filtered products
  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)),
    );
  }, [products, search]);

  // Cart calculations
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.sellingPrice * item.quantity,
        0,
      ),
    [cart],
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const incrementItem = (productId: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.quantity < i.product.stockQty
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      ),
    );
  };

  const decrementItem = (productId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Checkout handler
  const handleConfirmSale = async (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    discount: number,
    mpesaRef?: string,
  ) => {
    try {
      const sale = await createSale({
        shopId: shopId!,
        paymentMethod,
        amountPaid,
        discount,
        mpesaRef,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      setCompletedSale(sale);
      setShowCheckout(false);
      setShowReceipt(true);
    } catch (error: any) {
      Alert.alert(
        "Sale Failed",
        error.response?.data?.error ?? "Something went wrong",
      );
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    clearCart();
    setActiveTab("products");
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
            marginBottom: 14,
          }}
        >
          <Text style={{ color: COLORS.fg, fontSize: 22, fontWeight: "700" }}>
            Point of Sale
          </Text>
          {cart.length > 0 && (
            <TouchableOpacity onPress={clearCart}>
              <Text style={{ color: COLORS.red, fontSize: 13 }}>
                Clear cart
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switch */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: COLORS.bgSoft,
            borderRadius: 10,
            padding: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("products")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor:
                activeTab === "products" ? COLORS.yellow : "transparent",
            }}
          >
            <Text
              style={{
                color: activeTab === "products" ? COLORS.bg : COLORS.gray,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("cart")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor:
                activeTab === "cart" ? COLORS.yellow : "transparent",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                color: activeTab === "cart" ? COLORS.bg : COLORS.gray,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Cart
            </Text>
            {cartCount > 0 && (
              <View
                style={{
                  backgroundColor:
                    activeTab === "cart" ? COLORS.bg : COLORS.yellow,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    color: activeTab === "cart" ? COLORS.yellow : COLORS.bg,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Tab */}
      {activeTab === "products" && (
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.bgSoft,
              borderRadius: 10,
              paddingHorizontal: 12,
              marginHorizontal: 16,
              marginBottom: 10,
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
              placeholder="Search products..."
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

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => addToCart(product)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Cart Tab */}
      {activeTab === "cart" && (
        <View style={{ flex: 1 }}>
          {cart.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="shopping-cart" size={40} color={COLORS.gray} />
              <Text
                style={{
                  color: COLORS.fg,
                  fontWeight: "600",
                  marginTop: 16,
                  fontSize: 16,
                }}
              >
                Cart is empty
              </Text>
              <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 6 }}>
                Add products from the Products tab
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 24,
                }}
              >
                {cart.map((item) => (
                  <CartRow
                    key={item.product.id}
                    item={item}
                    onIncrement={() => incrementItem(item.product.id)}
                    onDecrement={() => decrementItem(item.product.id)}
                    onRemove={() => removeItem(item.product.id)}
                  />
                ))}
              </ScrollView>

              {/* Checkout Footer */}
              <View
                style={{
                  padding: 16,
                  backgroundColor: COLORS.bgSoft,
                  borderTopWidth: 1,
                  borderTopColor: COLORS.gray + "30",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: COLORS.gray, fontSize: 14 }}>
                    {cartCount} item{cartCount !== 1 ? "s" : ""}
                  </Text>
                  <Text
                    style={{
                      color: COLORS.fg,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatKES(subtotal)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCheckout(true)}
                  style={{
                    backgroundColor: COLORS.yellow,
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.bg,
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Proceed to Checkout
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* Modals */}
      <CheckoutModal
        visible={showCheckout}
        subtotal={subtotal}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleConfirmSale}
      />
      <ReceiptModal
        visible={showReceipt}
        sale={completedSale}
        onClose={handleReceiptClose}
      />
    </View>
  );
}
