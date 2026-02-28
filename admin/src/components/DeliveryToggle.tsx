import { Bike, Store, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

export const DeliveryToggle = () => {
  const { 
    deliveryMode, 
    setDeliveryMode, 
    postcode, 
    setPostcode, 
    isValidPostcode,
    subtotal 
  } = useCart();

  const showPostcodeError = postcode.length >= 3 && !isValidPostcode;
  const showPostcodeSuccess = postcode.length >= 3 && isValidPostcode;
  const freeDeliveryThreshold = 25;
  const amountToFreeDelivery = Math.max(freeDeliveryThreshold - subtotal, 0);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card">
      {/* Toggle */}
      <div className="flex bg-muted rounded-xl p-1 mb-4">
        <button
          onClick={() => setDeliveryMode("delivery")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-body font-medium text-sm transition-all",
            deliveryMode === "delivery"
              ? "bg-background text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bike className="w-4 h-4" />
          Delivery
        </button>
        <button
          onClick={() => setDeliveryMode("collection")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-body font-medium text-sm transition-all",
            deliveryMode === "collection"
              ? "bg-background text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="w-4 h-4" />
          Collection
        </button>
      </div>

      {/* Postcode Input (for delivery) */}
      {deliveryMode === "delivery" && (
        <div className="space-y-3">
          <div className="relative">
            <MapPin className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
              showPostcodeError ? "text-destructive" : 
              showPostcodeSuccess ? "text-green-500" : 
              "text-muted-foreground"
            )} />
            <Input
              type="text"
              placeholder="Enter your postcode (e.g. SE9 1XX)"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              className={cn(
                "pl-10 pr-10 h-12 font-body transition-all",
                showPostcodeError && "border-destructive focus-visible:ring-destructive",
                showPostcodeSuccess && "border-green-500 focus-visible:ring-green-500"
              )}
            />
            {showPostcodeSuccess && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
            {showPostcodeError && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
            )}
          </div>
          
          {/* Error message */}
          {showPostcodeError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Sorry, we don't deliver to this area
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  We currently deliver to SE9, Eltham, New Eltham, and surrounding areas only.
                </p>
              </div>
            </div>
          )}

          {/* Success message with delivery fee info */}
          {showPostcodeSuccess && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600">
                  Great news! We deliver to your area
                </p>
                {subtotal >= freeDeliveryThreshold ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    🎉 You qualify for FREE delivery!
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Add £{amountToFreeDelivery.toFixed(2)} more for free delivery (£2.50 fee)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery area info */}
          {!postcode && (
            <p className="text-xs text-muted-foreground">
              We deliver to SE9, SE18, SE2, DA16, DA15, BR7 postcodes
            </p>
          )}
        </div>
      )}

      {/* Collection Address */}
      {deliveryMode === "collection" && (
        <div className="flex items-start gap-3 p-3 bg-muted rounded-xl">
          <Store className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-body font-medium text-foreground">Lebanese Flames</p>
            <p className="text-sm text-muted-foreground">381 Footscray Road, New Eltham, London SE9 2DR</p>
            <p className="text-xs text-muted-foreground mt-1">Open: 12:00pm - 11:00pm daily</p>
          </div>
        </div>
      )}
    </div>
  );
};
