import { Check, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/context/CartContext";
import { MenuItem, SelectedCustomization } from "@/types/menu";

interface ItemCustomizationModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemCustomizationModal = ({ item, isOpen, onClose }: ItemCustomizationModalProps) => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const handleOptionToggle = (customizationId: string, optionId: string, maxSelections?: number) => {
    setSelectedOptions(prev => {
      const current = prev[customizationId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [customizationId]: current.filter(id => id !== optionId) };
      }
      if (maxSelections && current.length >= maxSelections) {
        return prev;
      }
      return { ...prev, [customizationId]: [...current, optionId] };
    });
  };

  const calculateTotal = () => {
    let total = item.price;
    if (item.customizations) {
      item.customizations.forEach(customization => {
        const selected = selectedOptions[customization.id] || [];
        selected.forEach(optionId => {
          const option = customization.options.find(o => o.id === optionId);
          if (option) {
            total += option.price;
          }
        });
      });
    }
    return total * quantity;
  };

  const handleAddToCart = () => {
    const customizations: SelectedCustomization[] = Object.entries(selectedOptions).map(
      ([customizationId, optionIds]) => ({ customizationId, optionIds })
    );
    addItem(item, quantity, customizations, calculateTotal());

    toast.custom((toastId) => (
      <div
        onClick={() => {
          const el = document.querySelector(`[data-sonner-toast][data-toast-id="${toastId}"]`) as HTMLElement;
          if (el) {
            el.style.transition = "opacity 0.3s ease-out";
            el.style.opacity = "0";
          }
          setTimeout(() => {
            toast.dismiss(toastId);
            navigate("/checkout");
          }, 300);
        }}
        className="flex items-center gap-3 w-full p-4 rounded-lg border border-border bg-background text-foreground shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-semibold text-sm text-foreground truncate">
            {item.name} added to your order!
          </p>
          <p className="text-xs text-muted-foreground">
            Quantity: {quantity}
          </p>
          <p className="text-xs text-primary font-medium mt-1">
            Click to view your order →
          </p>
        </div>
      </div>
    ), { duration: 4000 });
    onClose();
    setQuantity(1);
    setSelectedOptions({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background p-0">
        {/* Image Header */}
        <div className="relative aspect-video">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
              No image available
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-charcoal/50 hover:bg-charcoal/70 text-cream p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-display text-2xl text-foreground">
              {item.name}
            </DialogTitle>
            <p className="text-muted-foreground font-body">{item.description}</p>
          </DialogHeader>

          {/* Customizations */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="space-y-6 mb-6">
              {item.customizations.map((customization) => (
                <div key={customization.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-body font-semibold text-foreground">
                      {customization.name}
                      {customization.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </h4>
                    {customization.maxSelections && (
                      <span className="text-sm text-muted-foreground">
                        Max {customization.maxSelections}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {customization.options.map((option) => {
                      const isSelected = (selectedOptions[customization.id] || []).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionToggle(customization.id, option.id, customization.maxSelections)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className="font-body text-foreground">{option.name}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-muted-foreground font-body">
                              +£{option.price.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between py-4 border-t border-border">
            <span className="font-body font-medium text-foreground">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-body font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="flame"
            size="lg"
            className="w-full mt-4"
            onClick={handleAddToCart}
          >
            Add to Order · £{calculateTotal().toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
