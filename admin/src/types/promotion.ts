export interface Promotion {
  _id: string;
  code: string;
  description?: string;
  discountType: "percent" | "amount";
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  startsAt?: string;
  endsAt?: string;
  firstOrderOnly?: boolean;
  minCompletedOrders?: number;
  active: boolean;
}
