import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const PromoBanner = () => {
  return (
    <div className="bg-gradient-to-r from-flame to-flame-glow text-primary-foreground py-3 px-4">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 rounded-full p-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold">25% off your 1st online order</span>
              <span className="ml-2 text-primary-foreground/90">
                Use code WELCOME25 at checkout
              </span>
            </div>
          </div>
          <Button variant="gold" size="sm" asChild>
            <Link to="/menu">Order Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
