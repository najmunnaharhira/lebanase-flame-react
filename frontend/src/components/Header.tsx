import logo from "@/assets/logo.png";
import { MapPin, Menu, Phone, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
<<<<<<< Updated upstream
import {
  DEFAULT_BUSINESS_NAME,
  fetchBusinessBranding,
  resolveMenuImageUrl,
} from "@/lib/api";
=======
import { API_BASE_URL } from "@/lib/api";
>>>>>>> Stashed changes

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Menu", path: "/menu" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logoSrc, setLogoSrc] = useState(logo);
<<<<<<< Updated upstream
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
=======
>>>>>>> Stashed changes
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart(); // Get totalItems from CartContext (assuming this hook exists)

  useEffect(() => {
<<<<<<< Updated upstream
    const controller = new AbortController();
    const logoCacheKey = "lf_logo_frontend";
    const nameCacheKey = "frontendBusinessNameCache";

    const cachedLogo = sessionStorage.getItem(logoCacheKey);
    if (cachedLogo) {
      setLogoSrc(resolveMenuImageUrl(cachedLogo));
    }

    const cachedName = sessionStorage.getItem(nameCacheKey);
    if (cachedName) {
      setBusinessName(cachedName);
    }

    const loadLogo = async () => {
      try {
        const branding = await fetchBusinessBranding(controller.signal);
        if (branding.logoUrl) {
          const normalizedLogo = resolveMenuImageUrl(branding.logoUrl);
          setLogoSrc(normalizedLogo);
          sessionStorage.setItem(logoCacheKey, normalizedLogo);
        }
        setBusinessName(branding.businessName || DEFAULT_BUSINESS_NAME);
        sessionStorage.setItem(nameCacheKey, branding.businessName || DEFAULT_BUSINESS_NAME);
=======
    let isMounted = true;

    const loadLogo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/business`);
        if (!response.ok) return;
        const data = await response.json();
        const resolvedLogo = String(data?.logoUrl || "").trim();
        if (isMounted && resolvedLogo) {
          setLogoSrc(resolvedLogo);
        }
>>>>>>> Stashed changes
      } catch {
      }
    };

    loadLogo();
<<<<<<< Updated upstream
    return () => controller.abort();
=======

    return () => {
      isMounted = false;
    };
>>>>>>> Stashed changes
  }, []);

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

      {/* Main header */}
      <div className="container py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={logoSrc}
<<<<<<< Updated upstream
              alt={businessName}
=======
              alt="Lebanese Flames" 
>>>>>>> Stashed changes
              className="h-14 md:h-16 w-auto"
              onError={() => setLogoSrc(logo)}
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
            {/* Mobile cart badge */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" asChild>
              <Link to="/cart">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
