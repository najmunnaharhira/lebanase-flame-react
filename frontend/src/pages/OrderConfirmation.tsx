import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useBusinessName } from "@/hooks/useBusinessName";
import { OrderRecord } from "@/types/order";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const businessName = useBusinessName();

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
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100vw; background: #fff; color: #222; box-shadow: none; border: none; }
        }
      `}</style>
      <Header />
      <main className="container py-16 text-center">
        <div id="invoice-print" className="max-w-lg mx-auto bg-card rounded-2xl shadow-card p-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Order confirmed
          </h1>
          <p className="text-muted-foreground mb-6">
            Thanks for ordering with {businessName}. Your order has been received and we are preparing your food. Check your email for the itemized receipt and invoice.
          </p>
          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground mb-6">
            Order reference: <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          {order && (
            <div className="space-y-2 text-sm text-muted-foreground mb-6 text-left max-w-sm mx-auto border border-orange-200 rounded-lg bg-orange-50 p-4 shadow">
              <div className="font-bold text-orange-700 text-lg mb-2">Invoice Details</div>
              {order.invoiceNumber && (
                <div>
                  Invoice: <span className="font-semibold text-foreground">{order.invoiceNumber}</span>
                </div>
              )}
              <div>
                Name: <span className="font-semibold text-foreground">{order.address?.fullName || "-"}</span>
              </div>
              <div>
                Email: <span className="font-semibold text-foreground">{order.email}</span>
              </div>
              <div>
                Phone: <span className="font-semibold text-foreground">{order.address?.phone || "-"}</span>
              </div>
              <div>
                Price: <span className="font-semibold text-foreground">£{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div>
                Discount Offer: <span className="font-semibold text-foreground">£{Number((order.promoDiscount || 0) + (order.loyaltyDiscount || 0)).toFixed(2)}</span>
              </div>
              <div>
                Total Price: <span className="font-semibold text-foreground">£{Number(order.total).toFixed(2)}</span>
              </div>
              <div>
                Payment: <span className="font-semibold text-foreground">
                  {order.paymentMethod === "card" && order.paymentStatus === "paid"
                    ? "Paid via Card"
                    : order.paymentMethod === "cash"
                      ? "Cash on Collection"
                      : `${order.paymentMethod} (${order.paymentStatus})`}
                </span>
              </div>
              {Number(order.cashbackEarned || 0) > 0 && (
                <div>
                  Cashback earned: <span className="font-semibold text-foreground">£{Number(order.cashbackEarned).toFixed(2)}</span>
                </div>
              )}
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
