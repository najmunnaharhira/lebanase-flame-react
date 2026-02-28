import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { CartItem, MenuItem, SelectedCustomization } from "@/types/menu";

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, customizations: SelectedCustomization[], totalPrice: number) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  orderCount: number;
  hasReward: boolean;
  loyaltyDiscount: number;
  applyLoyaltyReward: () => void;
  isRewardApplied: boolean;
  deliveryMode: "delivery" | "collection";
  setDeliveryMode: (mode: "delivery" | "collection") => void;
  deliveryFee: number;
  isValidPostcode: boolean;
  postcode: string;
  setPostcode: (postcode: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Valid postcodes for delivery (SE9, Eltham, New Eltham areas)
const VALID_POSTCODE_PREFIXES = ["SE9", "SE18", "SE2", "DA16", "DA15", "BR7"];

const CART_STORAGE_KEY = "lb_flames_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [orderCount, setOrderCount] = useState(4); // Mock: user has completed 4 orders
  const [isRewardApplied, setIsRewardApplied] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "collection">("delivery");
  const [postcode, setPostcode] = useState("");

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Silent fail: localStorage may be unavailable in some environments.
    }
  }, [items]);

  // User has reward if they completed 5 orders (next order is the 6th - 50% off)
  const hasReward = orderCount >= 5;

  const addItem = useCallback((
    menuItem: MenuItem,
    quantity: number,
    customizations: SelectedCustomization[],
    totalPrice: number
  ) => {
    setItems(prev => [...prev, { menuItem, quantity, customizations, totalPrice }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity, totalPrice: (item.totalPrice / item.quantity) * quantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setIsRewardApplied(false);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Silent fail.
    }
  }, []);

  const applyLoyaltyReward = useCallback(() => {
    if (hasReward && !isRewardApplied) {
      setIsRewardApplied(true);
    }
  }, [hasReward, isRewardApplied]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  
  // 50% loyalty discount when reward is applied
  const loyaltyDiscount = isRewardApplied ? subtotal * 0.5 : 0;

  // Validate postcode
  const isValidPostcode = useMemo(() => {
    if (!postcode) return false;
    const cleanedPostcode = postcode.toUpperCase().replace(/\s/g, "");
    return VALID_POSTCODE_PREFIXES.some(prefix => cleanedPostcode.startsWith(prefix));
  }, [postcode]);

  // Delivery fee: £2.50 for orders under £25, free over £25
  const deliveryFee = useMemo(() => {
    if (deliveryMode === "collection") return 0;
    if (!isValidPostcode) return 0;
    return subtotal >= 25 ? 0 : 2.50;
  }, [deliveryMode, subtotal, isValidPostcode]);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      orderCount,
      hasReward,
      loyaltyDiscount,
      applyLoyaltyReward,
      isRewardApplied,
      deliveryMode,
      setDeliveryMode,
      deliveryFee,
      isValidPostcode,
      postcode,
      setPostcode,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
