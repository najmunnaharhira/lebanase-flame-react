import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FoodCard } from "@/components/FoodCard";
import { Button } from "@/components/ui/button";
import { menuItems as fallbackItems } from "@/data/menuData";
import { apiRequest } from "@/lib/api";
import { MenuItem } from "@/types/menu";

export const MenuHighlights = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: menuItems = fallbackItems } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: () => apiRequest<MenuItem[]>("/menu"),
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const fullMenuLink = normalizedSearch
    ? `/menu?q=${encodeURIComponent(searchTerm.trim())}`
    : "/menu";
  const highlights = menuItems
    .filter((item) => item.isPopular)
    .filter((item) => {
      if (!normalizedSearch) return true;
      return `${item.name} ${item.description || ""}`
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .slice(0, 6);

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
            <Link to={fullMenuLink}>View full menu</Link>
          </Button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search popular dishes"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Search popular dishes"
          />
        </div>

        {highlights.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No popular dishes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
