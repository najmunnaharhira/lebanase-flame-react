import {
  deleteAdminOrder,
  getAdminOrderById,
  listAdminOrders,
  updateAdminOrderStatus,
} from "../services/adminOrderService.js";

export const getOrders = async (req, res) => {
  const orders = await listAdminOrders(req.query.status);
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await getAdminOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(order);
};

export const updateOrderStatus = async (req, res) => {
  const order = await updateAdminOrderStatus(
    req.params.id,
    req.body.orderStatus,
  );
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(order);
};

export const removeOrder = async (req, res) => {
  const removed = await deleteAdminOrder(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.status(204).send();
};
