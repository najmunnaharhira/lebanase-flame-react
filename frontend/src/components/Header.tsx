import { useState } from "react";
import { Menu, Phone, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { AuthModal } from "@/components/AuthModal";
import { getUserInitials } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Menu", path: "/menu" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();

  const userInitials = getUserInitials(user?.displayName, user?.email);

  return (
    <>
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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Cart icon with badge */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" asChild>
              <Link to="/cart">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
            </Button>
            {/* User avatar / sign-in */}
            {user ? (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/profile">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {userInitials}
                  </span>
                </Link>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign in
              </Button>
            )}
            <Button variant="flame" asChild>
              <Link to="/menu">Order Now</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile cart badge */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" asChild>
              <Link to="/cart">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background">
                <div className="flex flex-col h-full pt-8">
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
                    {user ? (
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className={`text-lg font-body font-medium py-2 px-4 rounded-lg transition-colors ${
                          location.pathname === "/profile"
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        Account
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setIsOpen(false); setAuthModalOpen(true); }}
                        className="text-lg font-body font-medium py-2 px-4 rounded-lg transition-colors text-left text-foreground hover:bg-muted"
                      >
                        Sign in
                      </button>
                    )}
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
    <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
  </>
  );
};
