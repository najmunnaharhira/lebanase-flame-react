import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { OrderRecord } from "@/types/order";
import { AdminHeader } from "@/components/AdminHeader";

const STATUS_OPTIONS = [
  "Order Received",
  "Preparing",
  "Ready for Collection",
  "Out for Delivery",
  "Completed",
];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders");
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16 space-y-6">
        <AdminHeader
          title="Live orders"
          subtitle="Manage status and track kitchen progress."
          onLogout={handleLogout}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Loading orders...
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No orders yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedOrders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-body font-semibold text-foreground">
                      Order #{order._id.slice(-6)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()} · {order.deliveryMode}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={order.status === status ? "flame" : "outline"}
                        onClick={() => handleStatusChange(order._id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <span key={item.menuItem.id} className="block">
                      {item.quantity}× {item.menuItem.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {order.invoiceNumber && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                      Invoice {order.invoiceNumber}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    Total £{order.total.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    {order.paymentMethod} · {order.paymentStatus}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
