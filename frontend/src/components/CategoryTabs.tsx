import { categories } from "@/data/menuData";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="sticky top-[120px] z-40 bg-background/95 backdrop-blur-md py-4 border-b border-border">
      <div className="container">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => onCategoryChange("all")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-body font-medium text-sm transition-all",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span>🍽️</span>
            <span>All</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-body font-medium text-sm transition-all",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
