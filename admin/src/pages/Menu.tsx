import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { FoodCard } from "@/components/FoodCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoyaltyBadge } from "@/components/LoyaltyBadge";
import { StickyCartBar } from "@/components/StickyCartBar";
import { categories, menuItems as fallbackItems } from "@/data/menuData";
import { apiRequest } from "@/lib/api";
import { renderCategoryIcon } from "@/lib/categoryIcons";
import { MenuItem } from "@/types/menu";

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const normalizeCategory = (value: string) => {
    if (value === "mains") return "main-courses";
    if (value === "sides") return "sides-extras";
    return value;
  };

  const { data: menuItems = fallbackItems } = useQuery<MenuItem[]>({
    queryKey: ["menu-items"],
    queryFn: () => apiRequest<MenuItem[]>("/menu"),
  });

  const filteredItems = activeCategory === "all"
    ? menuItems
    : menuItems.filter(item => normalizeCategory(item.category) === activeCategory);

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
        onCategoryChange={setActiveCategory} 
      />

      <main className="py-8 pb-24 md:pb-8">
        <div className="container">
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
