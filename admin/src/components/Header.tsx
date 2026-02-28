import { useState } from "react";
import { Menu, Phone, MapPin, User, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Menu", path: "/menu" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { orderCount, hasReward } = useCart();
  const { user } = useAuth();
  
  const ordersToReward = 5 - orderCount;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">381 Footscray Road, New Eltham, SE9 2DR</span>
            <span className="sm:hidden">SE9</span>
          </div>
          <a href="tel:07466305669" className="flex items-center gap-2 hover:text-accent transition-colors">
            <Phone className="w-4 h-4" />
            <span>07466 305 669</span>
          </a>
        </div>
      </div>

      {/* Reward Banner - shows when reward is unlocked */}
      {hasReward && (
        <div className="bg-gradient-to-r from-gold via-flame to-gold py-2 px-4 animate-pulse">
          <div className="container flex items-center justify-center gap-2 text-charcoal font-body font-semibold text-sm">
            <Gift className="w-5 h-5" />
            <span>🎉 Reward Unlocked: 50% Off Your Next Order!</span>
            <Gift className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Lebanese Flames" 
              className="h-14 md:h-16 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-body font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA + Loyalty */}
          <div className="hidden md:flex items-center gap-4">
            {/* Loyalty Progress (when logged in, show progress) */}
            {!hasReward && orderCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-full border border-gold/30">
                <Gift className="w-4 h-4 text-gold" />
                <span className="text-sm font-body font-medium text-foreground">
                  {ordersToReward} to reward
                </span>
              </div>
            )}
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
              <Link to={user ? "/profile" : "/auth"}>
                <User className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="flame" asChild>
              <Link to="/menu">Order Now</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile loyalty indicator */}
            {hasReward ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-gold/20 rounded-full">
                <Gift className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-gold">50% OFF</span>
              </div>
            ) : orderCount > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
                <span className="text-xs font-body font-medium">{orderCount}/5</span>
              </div>
            ) : null}
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background">
                <div className="flex flex-col h-full pt-8">
                  {/* Mobile Loyalty Status */}
                  {hasReward ? (
                    <div className="mb-6 p-4 bg-gradient-to-r from-gold/20 to-flame/20 rounded-xl border border-gold/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-gold" />
                        <span className="font-display font-bold text-foreground">Reward Ready!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">50% off your next order</p>
                    </div>
                  ) : orderCount > 0 ? (
                    <div className="mb-6 p-4 bg-muted rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body font-medium text-foreground">Loyalty Progress</span>
                        <span className="text-sm text-muted-foreground">{orderCount}/5</span>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-flame to-gold transition-all"
                          style={{ width: `${(orderCount / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {ordersToReward} more orders until 50% off!
                      </p>
                    </div>
                  ) : null}
                  
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`text-lg font-body font-medium py-2 px-4 rounded-lg transition-colors ${
                          location.pathname === link.path
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                    <Link
                      to={user ? "/profile" : "/auth"}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-body font-medium py-2 px-4 rounded-lg transition-colors ${
                        location.pathname === "/profile" || location.pathname === "/auth"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      Account
                    </Link>
                  </nav>
                  <div className="mt-auto pb-8">
                    <Button variant="flame" className="w-full" size="lg" asChild>
                      <Link to="/menu" onClick={() => setIsOpen(false)}>
                        Order Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
