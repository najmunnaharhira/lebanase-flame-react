import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryTabs } from "@/components/CategoryTabs";
import { FoodCard } from "@/components/FoodCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoyaltyBadge } from "@/components/LoyaltyBadge";
import { StickyCartBar } from "@/components/StickyCartBar";
import { apiRequest } from "@/lib/api";
import { renderCategoryIcon } from "@/lib/categoryIcons";
import { Category, MenuItem } from "@/types/menu";

import {
  categories as fallbackCategories,
  menuItems as fallbackItems,
} from "@/data/menuData";

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get("category") || "all",
  );
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");

  const normalizeCategory = (value: string) => {
    if (value === "mains") return "main-courses";
    if (value === "sides") return "sides-extras";
    return value;
  };

  const { data: menuItems = fallbackItems } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: () => apiRequest<MenuItem[]>("/menu"),
  });

  const { data: categories = fallbackCategories } = useQuery<Category[]>({
    queryKey: ["menu-categories"],
    queryFn: () => apiRequest<Category[]>("/categories"),
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  useEffect(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    setSearchTerm(query);
    setActiveCategory(category);
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const nextParams = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) {
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const nextParams = new URLSearchParams(searchParams);
    if (category && category !== "all") {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (activeCategory === "all") return;
    const exists = categories.some((category) => category.id === activeCategory);
    if (exists) return;

    setActiveCategory("all");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    setSearchParams(nextParams, { replace: true });
  }, [activeCategory, categories, searchParams, setSearchParams]);

  const filteredItems = menuItems.filter((item) => {
    const inCategory =
      activeCategory === "all" || normalizeCategory(item.category) === activeCategory;

    if (!inCategory) return false;
    if (!normalizedSearch) return true;

    const categoryName =
      categories.find((category) => category.id === normalizeCategory(item.category))
        ?.name || "";

    const searchable = `${item.name} ${item.description || ""} ${categoryName}`.toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-8 md:py-12">
        <div className="container">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-2">
            Our Menu
          </h1>
          <p className="text-muted-foreground font-body text-center max-w-md mx-auto">
            Fresh, authentic Lebanese dishes made with love
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/LEBANESE_FLAMES_Food_Menu.pdf"
              className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:border-flame hover:text-flame"
              target="_blank"
              rel="noreferrer"
            >
              Show Main Menu (PDF)
            </a>
            <a
              href="/Lunch%20menu.pdf"
              className="rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:border-flame hover:text-flame"
              target="_blank"
              rel="noreferrer"
            >
              Show Lunch Deals (PDF)
            </a>
          </div>
        </div>
      </section>

      <CategoryTabs 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange}
        categories={categories}
      />

      <main className="py-8 pb-24 md:pb-8">
        <div className="container">
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search food by name, dish, or category"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Search food"
            />
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Menu Grid */}
            <div className="lg:col-span-3">
              {categories.map((category) => {
                const categoryItems = filteredItems.filter(item => 
                  activeCategory === "all" ? normalizeCategory(item.category) === category.id : true
                );
                
                if (categoryItems.length === 0 && activeCategory !== "all") {
                  return (
                    <div key={category.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map((item) => (
                        <FoodCard key={item.id} item={item} />
                      ))}
                    </div>
                  );
                }
                
                if (categoryItems.length === 0) return null;

                return activeCategory === "all" ? (
                  <div key={category.id} className="mb-10">
                    <h2 className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                      <span>{renderCategoryIcon(category.icon, "h-5 w-5")}</span>
                      {category.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryItems.map((item) => (
                        <FoodCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ) : null;
              })}

              {filteredItems.length === 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  No food found. Try another keyword.
                </div>
              )}
              
              {activeCategory !== "all" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[180px] space-y-6">
                <LoyaltyBadge />
                
                {/* Info Card */}
                <div className="bg-card rounded-2xl p-5 shadow-card">
                  <h3 className="font-display font-semibold text-foreground mb-3">
                    Ordering Info
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground font-body">
                    <li>✓ Free delivery over £25</li>
                    <li>✓ 25-35 min delivery time</li>
                    <li>✓ Minimum order £12</li>
                    <li>✓ Collection available</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <StickyCartBar />
    </div>
  );
};

export default Menu;
