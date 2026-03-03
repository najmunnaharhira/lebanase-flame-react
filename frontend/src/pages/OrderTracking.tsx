import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useBusinessName } from "@/hooks/useBusinessName";
import { OrderRecord } from "@/types/order";

const STATUS_STEPS = [
  "Food Processing",
  "Out for delivery",
  "Delivered",
];

const normalizeOrderStatus = (status: string) => {
  const mapping: Record<string, string> = {
    "Order Received": "Food Processing",
    Preparing: "Food Processing",
    "Ready for Collection": "Out for delivery",
    "Out for Delivery": "Out for delivery",
    Completed: "Delivered",
    "Food Processing": "Food Processing",
    "Out for delivery": "Out for delivery",
    Delivered: "Delivered",
  };

  return mapping[status] || "Food Processing";
};

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState("");
  const businessName = useBusinessName();

  const currentStep = useMemo(() => {
    if (!order) return 0;
    const index = STATUS_STEPS.indexOf(normalizeOrderStatus(order.status));
    return Math.max(index, 0);
  }, [order]);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    const loadOrder = async () => {
      try {
        const data = await apiRequest<OrderRecord>(`/orders/${orderId}`);
        if (isMounted) {
          setOrder(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load order");
        }
      }
    };

    loadOrder();
    const timer = window.setInterval(loadOrder, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="max-w-2xl mx-auto bg-card rounded-2xl shadow-card p-6 md:p-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            Track your order
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Live status updates for your {businessName} order.
          </p>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          <div className="rounded-xl border border-border p-4 mb-6 text-sm text-muted-foreground">
            Order reference:{" "}
            <span className="font-semibold text-foreground">{orderId}</span>
          </div>

          {order ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {STATUS_STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                      index <= currentStep ? "border-primary bg-primary/10" : "border-border"
                    }`}
                  >
                    <span className={index <= currentStep ? "text-foreground" : "text-muted-foreground"}>
                      {step}
                    </span>
                    {index <= currentStep && <span className="text-xs text-primary">Active</span>}
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Current status:{" "}
                <span className="font-semibold text-foreground">{normalizeOrderStatus(order.status)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Loading order status...
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/menu">Order again</Link>
            </Button>
            <Button variant="flame" asChild>
              <Link to="/contact">Need help?</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderTracking;
