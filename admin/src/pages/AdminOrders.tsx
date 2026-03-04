import { Package, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/AdminHeader";
import { clearAdminSession, getAdminAuthHeaders, hasAdminSession } from "@/lib/adminAuth";
import { demoOrders } from "@/lib/adminDemoData";
import { API_BASE_URL, DEFAULT_BUSINESS_NAME, apiRequest } from "@/lib/api";
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

  const handlePrint = (order: OrderRecord) => {
    const orderId = order._id.slice(-8).toUpperCase();
    const date = new Date(order.createdAt).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const customer = order.address?.fullName || order.email || "Customer";
    const phone = order.address?.phone || "";
    const addressLines = [
      order.address?.line1,
      order.address?.line2,
      order.address?.city,
      order.address?.postcode,
    ].filter(Boolean).join(", ");

    const itemRows = order.items.map((item) =>
      `<tr>
        <td style="padding:2px 4px">${item.menuItem.name}</td>
        <td style="text-align:center;padding:2px 4px">x${item.quantity}</td>
        <td style="text-align:right;padding:2px 4px">£${(item.menuItem.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Order Receipt #${orderId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; font-size: 13px; width: 280px; margin: 0 auto; padding: 12px; }
    h1 { font-size: 16px; text-align: center; font-weight: bold; margin-bottom: 2px; }
    .center { text-align: center; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
    .label { color: #555; }
    @media print { @page { margin: 6mm; } }
  </style>
</head>
<body>
  <h1>${DEFAULT_BUSINESS_NAME}</h1>
  <p class="center" style="font-size:11px">Order Receipt</p>
  <div class="divider"></div>
  <p><span class="label">Order:</span> #${orderId}</p>
  <p><span class="label">Date:</span> ${date}</p>
  <p><span class="label">Customer:</span> ${customer}</p>
  ${phone ? `<p><span class="label">Phone:</span> ${phone}</p>` : ""}
  ${order.deliveryMode === "delivery" && addressLines ? `<p><span class="label">Delivery to:</span> ${addressLines}</p>` : `<p><span class="label">Mode:</span> ${order.deliveryMode || "collection"}</p>`}
  <div class="divider"></div>
  <table>
    ${itemRows}
  </table>
  <div class="divider"></div>
  <table>
    <tr class="total-row">
      <td>TOTAL</td>
      <td></td>
      <td style="text-align:right">£${order.total.toFixed(2)}</td>
    </tr>
  </table>
  <div class="divider"></div>
  <p><span class="label">Payment:</span> ${order.paymentMethod || "—"} · ${getPaymentLabel(order.paymentStatus)}</p>
  <p><span class="label">Status:</span> ${order.status}</p>
  <div class="divider"></div>
  <p class="center" style="margin-top:6px">Thank you for your order!</p>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

    const popup = window.open("", "_blank", "width=340,height=600");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
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
                    {Number(order.cashbackEarned || 0) > 0 && (
                      <span className="text-xs text-emerald-600">
                        Cashback £{Number(order.cashbackEarned).toFixed(2)}
                      </span>
                    )}
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
                <button
                  type="button"
                  title="Print receipt"
                  onClick={() => handlePrint(order)}
                  className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition-colors"
                >
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </button>
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
