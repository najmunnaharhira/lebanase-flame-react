import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useBusinessName } from "@/hooks/useBusinessName";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const businessName = useBusinessName();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 text-center">
        <div className="max-w-lg mx-auto bg-card rounded-2xl shadow-card p-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">
            Order confirmed
          </h1>
          <p className="text-muted-foreground mb-6">
            Thanks for ordering with {businessName}. We are preparing your food now.
          </p>
          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground mb-6">
            Order reference: <span className="font-semibold text-foreground">{orderId}</span>
          </div>
          <Button variant="flame" asChild>
            <Link to="/menu">Order more</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
