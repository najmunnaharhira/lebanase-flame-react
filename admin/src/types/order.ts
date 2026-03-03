import { CartItem } from "@/types/menu";

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

export interface OrderInput {
  userId?: string;
  email: string;
  deliveryMode: "delivery" | "collection";
  address?: Address;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  loyaltyDiscount: number;
  promoCode?: string;
  promoDiscount?: number;
  cashbackEarned?: number;
  total: number;
  paymentMethod: "card" | "cash";
  invoiceNumber?: string;
  receiptEmailSent?: boolean;
  paymentIntentId?: string;
  paymentStatus?: "pending" | "paid" | "cash_on_collection";
  notes?: string;
}

export interface OrderRecord extends OrderInput {
  _id: string;
  status: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  addresses: Address[];
  rewardPoints?: number;
}
