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

export const CATEGORY_ICON_OPTIONS = [
  { value: "Utensils", label: "Utensils" },
  { value: "Salad", label: "Salad" },
  { value: "Flame", label: "Flame" },
  { value: "CookingPot", label: "Cooking Pot" },
  { value: "Sandwich", label: "Sandwich" },
  { value: "Droplets", label: "Droplets" },
  { value: "Users", label: "Users" },
  { value: "CakeSlice", label: "Cake Slice" },
  { value: "CupSoda", label: "Cup Soda" },
  { value: "Clock3", label: "Clock" },
];

export const DEFAULT_CATEGORY_ICON = "Utensils";

export const renderCategoryIcon = (icon: string | null | undefined, className = "h-4 w-4"): ReactNode => {
  const key = String(icon || "").trim();
  const Icon = categoryIconMap[key];
  if (Icon) {
    return <Icon className={className} aria-hidden="true" />;
  }

  return <span>{key || "🍽️"}</span>;
};
