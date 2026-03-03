import { CakeSlice, Clock3, CookingPot, CupSoda, Droplets, Flame, Salad, Sandwich, Users, Utensils, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

const categoryIconMap: Record<string, LucideIcon> = {
  Utensils,
  Salad,
  Flame,
  CookingPot,
  Sandwich,
  Droplets,
  Users,
  CakeSlice,
  CupSoda,
  Clock3,
};

export const renderCategoryIcon = (icon: string | null | undefined, className = "h-4 w-4"): ReactNode => {
  const key = String(icon || "").trim();
  const Icon = categoryIconMap[key];
  if (Icon) {
    return <Icon className={className} aria-hidden="true" />;
  }

  return <span>{key || "🍽️"}</span>;
};
