import { menuItems } from "@/data/menuData";
import { FoodCard } from "@/components/FoodCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const MenuHighlights = () => {
  const highlights = menuItems.filter((item) => item.isPopular).slice(0, 6);

  return (
    <section className="py-12 md:py-16 bg-cream">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
              Menu highlights
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              Our Menu
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Fresh mezze, charcoal grills, and wraps crafted for London taste buds.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/menu">View full menu</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
