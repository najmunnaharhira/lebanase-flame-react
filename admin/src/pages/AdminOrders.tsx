import { Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoOrders } from "@/lib/adminDemoData";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { OrderRecord } from "@/types/order";

const STATUS_OPTIONS = [
  "Food Processing",
  "Out for delivery",
  "Delivered",
];

type PaymentFilter = "all" | "paid" | "pending" | "cash_on_collection";

const getPaymentBadgeClass = (paymentStatus?: string) => {
  if (paymentStatus === "paid") {
    return "bg-emerald-500/10 text-emerald-600";
  }
  if (paymentStatus === "cash_on_collection") {
    return "bg-sky-500/10 text-sky-600";
  }
  return "bg-amber-500/10 text-amber-600";
};

const getPaymentLabel = (paymentStatus?: string) => {
  if (paymentStatus === "paid") return "Paid";
  if (paymentStatus === "cash_on_collection") return "Cash on collection";
  return "Pending";
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadOrders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await apiRequest<OrderRecord[]>("/admin/orders");
        setOrders(data);
        setIsDemoMode(false);
      } catch (err) {
        setOrders(demoOrders as OrderRecord[]);
        setIsDemoMode(true);
        setError("API unavailable. Showing demo orders.");
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();

    const pollId = window.setInterval(async () => {
      try {
        const data = await apiRequest<OrderRecord[]>("/admin/orders");
        setOrders(data);
        setIsDemoMode(false);
      } catch {
        // Keep current view on polling failures.
      }
    }, 10000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [navigate]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (paymentFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => {
      const status = order.paymentStatus || "pending";
      return status === paymentFilter;
    });
  }, [paymentFilter, sortedOrders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    if (isDemoMode) {
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, status } : order)));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update status");
      }

      const updated = await response.json();
      setOrders((prev) => prev.map((order) => (order._id === updated._id ? updated : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order");
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin");
  };

  const getSummary = (order: OrderRecord) => {
    const topItems = order.items.slice(0, 2);
    const parts = topItems.map((item) => `${item.menuItem.name} x ${item.quantity}`);
    const remaining = order.items.length - topItems.length;
    if (remaining > 0) {
      parts.push(`+${remaining} more`);
    }
    return parts.join(", ");
  };

  const renderOrders = () => {
    if (isLoading) {
      return (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading orders...
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No orders found for selected payment filter.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <div key={order._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                  {order.items[0]?.menuItem?.image ? (
                    <img
                      src={order.items[0].menuItem.image}
                      alt={order.items[0].menuItem.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-body font-semibold text-foreground">{getSummary(order)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.address?.fullName || order.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()} · {order.deliveryMode}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPaymentBadgeClass(order.paymentStatus)}`}
                    >
                      {getPaymentLabel(order.paymentStatus)}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">£{order.total.toFixed(2)}</span>
                <select
                  aria-label="Order status"
                  value={order.status}
                  onChange={(event) => handleStatusChange(order._id, event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Live orders"
          subtitle="Manage status and track kitchen progress."
          onLogout={handleLogout}
          isDemoMode={isDemoMode}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPaymentFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            All payments
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter("paid")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "paid"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                : "border-border text-muted-foreground hover:border-emerald-500/50"
            }`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter("pending")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "pending"
                ? "border-amber-500 bg-amber-500/10 text-amber-600"
                : "border-border text-muted-foreground hover:border-amber-500/50"
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setPaymentFilter("cash_on_collection")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              paymentFilter === "cash_on_collection"
                ? "border-sky-500 bg-sky-500/10 text-sky-600"
                : "border-border text-muted-foreground hover:border-sky-500/50"
            }`}
          >
            Cash on collection
          </button>
        </div>

        {renderOrders()}
      </main>
    </div>
  );
};

export default AdminOrders;
