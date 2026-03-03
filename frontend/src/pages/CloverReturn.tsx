import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

/**
 * CloverReturn – landing page after a Clover Hosted Checkout redirect.
 * Clover appends ?session_id=<checkoutSessionId> to the return URL.
 */
const CloverReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 text-center space-y-6">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Payment Received
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your order. Your Clover payment has been submitted and
          is being processed.
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground">
            Reference: <span className="font-mono">{sessionId}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="flame" asChild>
            <Link to="/menu">Back to menu</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/profile">View orders</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CloverReturn;
