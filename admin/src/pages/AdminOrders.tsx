import { Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoOrders } from "@/lib/adminDemoData";
import { API_BASE_URL } from "@/lib/api";
import { OrderRecord } from "@/types/order";

const STATUS_OPTIONS = [
  "Food Processing",
  "Out for delivery",
  "Delivered",
];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (!hasAdminSession()) {
      navigate("/admin");
      return;
    }

    const loadOrders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) {
          throw new Error("Failed to load orders");
        }
        const data = await response.json();
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
  }, [navigate]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

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

    if (sortedOrders.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No orders yet.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {sortedOrders.map((order) => (
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

        {renderOrders()}
      </main>
    </div>
  );
};

export default AdminOrders;
