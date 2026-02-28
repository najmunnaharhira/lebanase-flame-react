import { Gift, Flame, PartyPopper } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LoyaltyBadge = () => {
  const { orderCount, hasReward, isRewardApplied, applyLoyaltyReward, subtotal } = useCart();
  const totalOrders = 5;
  const progress = Math.min((orderCount / totalOrders) * 100, 100);
  const ordersRemaining = Math.max(totalOrders - orderCount, 0);

  // Reward unlocked state (after 5 orders)
  if (hasReward && !isRewardApplied) {
    return (
      <div className="bg-gradient-to-br from-gold/30 via-flame/20 to-gold/30 border-2 border-gold rounded-2xl p-5 animate-fade-in relative overflow-hidden">
        {/* Celebration particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-4 animate-bounce delay-100">🎉</div>
          <div className="absolute top-4 right-6 animate-bounce delay-300">🎊</div>
          <div className="absolute bottom-4 left-8 animate-bounce delay-500">✨</div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gold rounded-xl p-3">
              <PartyPopper className="w-6 h-6 text-charcoal" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-foreground">
                🎉 Reward Unlocked!
              </h3>
              <p className="text-sm text-muted-foreground font-body">
                You've earned 50% off this order!
              </p>
            </div>
          </div>
          
          <Button 
            variant="flame" 
            className="w-full mt-3"
            onClick={applyLoyaltyReward}
            disabled={subtotal === 0}
          >
            Apply 50% Discount
          </Button>
          
          {subtotal === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Add items to apply your reward
            </p>
          )}
        </div>
      </div>
    );
  }

  // Reward applied state
  if (isRewardApplied) {
    return (
      <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 rounded-xl p-3">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-green-600">
              ✓ Reward Applied!
            </h3>
            <p className="text-sm text-muted-foreground font-body">
              50% off has been applied to your order
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Progress state (working towards reward)
  return (
    <div className="bg-gradient-to-br from-gold/20 to-flame/10 border border-gold/30 rounded-2xl p-5 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="bg-gold rounded-xl p-3 shrink-0">
          <Gift className="w-6 h-6 text-charcoal" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground mb-1">
            Flames Loyalty
          </h3>
          <p className="text-sm text-muted-foreground font-body mb-3">
            {ordersRemaining === 0 
              ? "🎉 You've earned 50% off!"
              : `${ordersRemaining} more order${ordersRemaining > 1 ? 's' : ''} until 50% off!`
            }
          </p>
          
          {/* Progress Bar */}
          <div className="relative">
            <Progress value={progress} className="h-3 bg-muted" />
            <div className="flex justify-between mt-2">
              {Array.from({ length: totalOrders }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < orderCount
                      ? "bg-flame text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    i === orderCount && "animate-pulse ring-2 ring-flame ring-offset-2"
                  )}
                >
                  {i < orderCount ? (
                    <Flame className="w-3 h-3" />
                  ) : (
                    i + 1
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-3 font-body">
            Buy 5, get 50% off your 6th order!
          </p>
        </div>
      </div>
    </div>
  );
};
