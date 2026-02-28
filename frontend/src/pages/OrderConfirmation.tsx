import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { OrderRecord } from "@/types/order";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const loadOrder = async () => {
      try {
        const data = await apiRequest<OrderRecord>(`/orders/${orderId}`);
        setOrder(data);
      } catch {
        // Ignore: display order reference only.
      }
    };
    loadOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 text-center">
        <div className="max-w-lg mx-auto bg-card rounded-2xl shadow-card p-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Order confirmed
          </h1>
          <p className="text-muted-foreground mb-6">
            Thanks for ordering with Lebanese Flames. Your order has been received and we are preparing your food. Check your email for the itemized receipt and invoice.
          </p>
          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground mb-6">
            Order reference: <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          {order && (
            <div className="space-y-2 text-sm text-muted-foreground mb-6 text-left max-w-sm mx-auto">
              {order.invoiceNumber && (
                <div>
                  Invoice: <span className="font-semibold text-foreground">{order.invoiceNumber}</span>
                </div>
              )}
              <div>
                Payment:{" "}
                <span className="font-semibold text-foreground">
                  {order.paymentMethod === "card" && order.paymentStatus === "paid"
                    ? "Paid via Card"
                    : order.paymentMethod === "cash"
                      ? "Cash on Collection"
                      : `${order.paymentMethod} (${order.paymentStatus})`}
                </span>
              </div>
              {order.receiptEmailSent && (
                <div>
                  Receipt sent to <span className="font-semibold text-foreground">{order.email}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="flame" asChild>
              <Link to={`/order-tracking/${orderId}`}>Track order</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/menu">Order more</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
