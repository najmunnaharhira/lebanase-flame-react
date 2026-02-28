import { menuItems } from "@/data/menuData";
import { FoodCard } from "@/components/FoodCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const MenuHighlights = () => {
  const highlights = menuItems.filter((item) => item.isPopular).slice(0, 6);

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Our menu
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Shawarma, grills, wraps, and fresh Lebanese sides.
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
