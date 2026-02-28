import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { LoyaltyBadge } from "@/components/LoyaltyBadge";

const Cart = () => {
  const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

  const deliveryFee = subtotal >= 25 ? 0 : 2.50;
  const total = subtotal + deliveryFee;

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              Your basket is empty
            </h1>
            <p className="text-muted-foreground font-body mb-8">
              Add some delicious Lebanese dishes to get started
            </p>
            <Button variant="flame" size="lg" asChild>
              <Link to="/menu">Browse Menu</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          Your Order
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-card rounded-2xl p-4 shadow-card flex gap-4">
                <img
                  src={item.menuItem.image}
                  alt={item.menuItem.name}
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-display font-semibold text-foreground">
                      {item.menuItem.name}
                    </h3>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground font-body line-clamp-1 mb-3">
                    {item.menuItem.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-body font-semibold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-body font-bold text-primary">
                      £{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <aside>
            <div className="sticky top-[140px] space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-foreground">
                      {deliveryFee === 0 ? (
                        <span className="text-olive font-medium">FREE</span>
                      ) : (
                        `£${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {subtotal < 25 && (
                    <p className="text-xs text-muted-foreground">
                      Spend £{(25 - subtotal).toFixed(2)} more for free delivery
                    </p>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg">
                      £{total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Button variant="flame" size="lg" className="w-full mt-6" asChild>
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>

              <LoyaltyBadge />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
