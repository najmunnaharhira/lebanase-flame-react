import { Flame as SpicyIcon, Leaf, Plus } from "lucide-react";
import { useState } from "react";
import { ItemCustomizationModal } from "./ItemCustomizationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";

interface FoodCardProps {
  item: MenuItem;
}

export const FoodCard = ({ item }: FoodCardProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              No image available
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {item.isPopular && (
              <Badge className="bg-flame text-primary-foreground border-0">
                Popular
              </Badge>
            )}
            {item.isVegetarian && (
              <Badge className="bg-olive text-primary-foreground border-0">
                <Leaf className="w-3 h-3 mr-1" />
                Veg
              </Badge>
            )}
            {item.isSpicy && (
              <Badge className="bg-destructive text-destructive-foreground border-0">
                <SpicyIcon className="w-3 h-3 mr-1" />
                Spicy
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
              {item.name}
            </h3>
            <span className="font-body font-bold text-primary text-lg whitespace-nowrap">
              £{item.price.toFixed(2)}
            </span>
          </div>
          
          <p className="text-muted-foreground text-sm font-body line-clamp-2 mb-4">
            {item.description}
          </p>

          <Button 
            variant="flame" 
            className="w-full" 
            onClick={() => setShowModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add to Order
          </Button>
        </div>
      </div>

      <ItemCustomizationModal
        item={item}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
