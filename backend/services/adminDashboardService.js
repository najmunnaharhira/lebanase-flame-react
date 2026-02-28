import { Order } from "../models/Order.js";

const toDateKey = (date) => date.toISOString().slice(0, 10);

export const getAdminDashboard = async () => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrdersToday,
    pendingOrders,
    revenueTodayAggregate,
    revenueMonthAggregate,
    topItems,
    recentOrders,
    last7Orders,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ status: { $in: ["Order Received", "Preparing"] } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, value: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, value: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.menuItem.name",
          count: { $sum: "$items.quantity" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Order.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    Order.find({
      createdAt: {
        $gte: new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    })
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const revenueChartMap = new Map();
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(startOfToday.getTime() - index * 24 * 60 * 60 * 1000);
    revenueChartMap.set(toDateKey(date), {
      date: toDateKey(date),
      revenue: 0,
      orders: 0,
    });
  }

  last7Orders.forEach((order) => {
    const key = toDateKey(new Date(order.createdAt));
    if (!revenueChartMap.has(key)) return;
    const bucket = revenueChartMap.get(key);
    bucket.revenue += Number(order.total || 0);
    bucket.orders += 1;
  });

  return {
    totalOrdersToday,
    totalRevenueToday: Number(revenueTodayAggregate[0]?.value || 0),
    totalRevenueThisMonth: Number(revenueMonthAggregate[0]?.value || 0),
    pendingOrdersCount: pendingOrders,
    topItems: topItems.map((item) => ({
      name: item._id || "Unknown",
      count: item.count,
    })),
    revenueChart: Array.from(revenueChartMap.values()),
    recentOrders: recentOrders.map((order) => ({
      id: order._id.toString(),
      total: Number(order.total || 0),
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      email: order.email,
    })),
  };
};
