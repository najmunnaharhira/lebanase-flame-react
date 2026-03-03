import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Star, Store } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";
import { DeliveryToggle } from "@/components/DeliveryToggle";
import { useBusinessName } from "@/hooks/useBusinessName";

export const Hero = () => {
  const businessName = useBusinessName();
  const stores = [
    {
      id: "eltham-se9",
      name: `${businessName} - Eltham (SE9)`,
      address: "381 Footscray Road, New Eltham, London SE9 2DR",
    },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={`${businessName} mezze spread`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Content */}
      <div className="relative container py-14 md:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="max-w-xl animate-fade-in">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-cream px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 fill-gold text-gold" />
                4.9 Rating
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-cream px-3 py-1.5 rounded-full text-sm font-medium">
                5★ Hygiene Rated
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-cream leading-tight mb-4">
              {businessName}
              <span className="block text-cream/90">Takeaway & Restaurant</span>
            </h1>

            <p className="text-lg md:text-xl text-cream/90 font-body mb-8 max-w-md">
              Fresh mezze, grills, and wraps made daily for Eltham, New Eltham, and SE9.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/menu">Order Now</Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="border-cream/40 text-cream hover:bg-cream hover:text-charcoal"
                asChild
              >
                <Link to="/menu">View Menu</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-cream/80">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">25-35 min delivery</span>
              </div>
              <div className="text-sm">Min order: £12.00</div>
            </div>
          </div>

          {/* Order Panel */}
          <div className="bg-background rounded-3xl p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
              <Store className="w-4 h-4" />
              Collection | Delivery
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Select the store to order from
                </label>
                <select
                  className="mt-2 w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue={stores[0].id}
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stores[0].address}
                </p>
              </div>
              <DeliveryToggle />
              <Button variant="flame" className="w-full" asChild>
                <Link to="/menu">Start Order</Link>
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Log in to view your recent orders
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
