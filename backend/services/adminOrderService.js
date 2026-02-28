import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";

const statusMapToLegacy = {
  pending: "Order Received",
  preparing: "Preparing",
  ready: "Ready for Collection",
  delivered: "Completed",
  cancelled: "Completed",
};

const statusMapFromLegacy = {
  "Order Received": "pending",
  Preparing: "preparing",
  "Ready for Collection": "ready",
  "Out for Delivery": "ready",
  Completed: "delivered",
};

const paymentStatusMap = {
  pending: "unpaid",
  paid: "paid",
  cash_on_collection: "paid",
};

const normalizeItems = (items = []) =>
  items.map((item) => ({
    menuId: item?.menuItem?.id || item?.menuItem?._id || "",
    name: item?.menuItem?.name || "Unknown Item",
    price: Number(item?.menuItem?.price || item?.totalPrice || 0),
    quantity: Number(item?.quantity || 1),
    customizations: item?.customizations || [],
    totalPrice: Number(item?.totalPrice || 0),
  }));

export const serializeAdminOrder = (order) => {
  const normalizedItems = normalizeItems(order.items || []);
  const discount =
    Number(order.loyaltyDiscount || 0) + Number(order.promoDiscount || 0);

  return {
    _id: order._id?.toString(),
    customerId: order.userId || "",
    items: normalizedItems,
    subtotal: Number(order.subtotal || 0),
    discount,
    deliveryFee: Number(order.deliveryFee || 0),
    total: Number(order.total || 0),
    paymentMethod: order.paymentMethod,
    paymentStatus: paymentStatusMap[order.paymentStatus] || "unpaid",
    orderStatus: statusMapFromLegacy[order.status] || "pending",
    orderType: order.deliveryMode,
    deliveryAddress: order.address || null,
    phone: order.address?.phone || "",
    notes: order.notes || "",
    createdAt: order.createdAt,
    legacyStatus: order.status,
    email: order.email,
    invoiceNumber: order.invoiceNumber,
  };
};

export const syncOrderItems = async (order) => {
  const normalizedItems = normalizeItems(order.items || []);
  if (!normalizedItems.length) return;

  await OrderItem.deleteMany({ orderId: order._id });
  await OrderItem.insertMany(
    normalizedItems.map((item) => ({
      orderId: order._id,
      menuId: item.menuId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customizations: item.customizations,
    })),
  );
};

export const listAdminOrders = async (status) => {
  const filter = {};
  if (status && status !== "all") {
    const legacy = statusMapToLegacy[status];
    if (legacy) filter.status = legacy;
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  return orders.map(serializeAdminOrder);
};

export const getAdminOrderById = async (id) => {
  const order = await Order.findById(id).lean();
  if (!order) return null;
  return serializeAdminOrder(order);
};

export const updateAdminOrderStatus = async (id, orderStatus) => {
  const legacyStatus = statusMapToLegacy[orderStatus] || "Order Received";
  const updated = await Order.findByIdAndUpdate(
    id,
    { status: legacyStatus },
    { new: true },
  ).lean();
  return updated ? serializeAdminOrder(updated) : null;
};

export const deleteAdminOrder = async (id) => {
  const deleted = await Order.findByIdAndDelete(id).lean();
  if (!deleted) return false;
  await OrderItem.deleteMany({ orderId: deleted._id });
  return true;
};
