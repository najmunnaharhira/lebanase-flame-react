import { menuItems } from "@/data/menuData";
import { FoodCard } from "./FoodCard";

export const FeaturedItems = () => {
  const popularItems = menuItems.filter(item => item.isPopular).slice(0, 4);

  return (
    <section className="py-12 md:py-16 bg-cream">
      <div className="container">
        <div className="text-center mb-10">
          <span className="text-primary font-body font-semibold text-sm uppercase tracking-wider">
            Customer Favourites
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
            Most Popular Dishes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};
