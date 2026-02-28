import { ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

export const StickyCartBar = () => {
  const { totalItems, subtotal } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-charcoal to-charcoal/95 animate-slide-up md:hidden">
      <Button variant="cart" size="lg" className="h-14" asChild>
        <Link to="/cart">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 rounded-full p-2">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-semibold">
              {totalItems} item{totalItems > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">£{subtotal.toFixed(2)}</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      </Button>
    </div>
  );
};
