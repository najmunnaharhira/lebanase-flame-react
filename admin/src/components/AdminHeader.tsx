import logo from "@/assets/logo.png";
import { getAdminRole } from "@/lib/adminAuth";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DEFAULT_BUSINESS_NAME, fetchBusinessBranding } from "@/lib/api";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  onLogout: () => void;
  isDemoMode?: boolean;
}

export const AdminHeader = ({ title, subtitle, onLogout, isDemoMode = false }: AdminHeaderProps) => {
  const [logoSrc, setLogoSrc] = useState(logo);
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
  const adminRole = getAdminRole();

  useEffect(() => {
    const controller = new AbortController();
    const logoCacheKey = "lf_logo_admin";
    const nameCacheKey = "lf_name_admin";

    const cachedLogo = sessionStorage.getItem(logoCacheKey);
    if (cachedLogo) {
      setLogoSrc(cachedLogo);
    }

    const cachedName = sessionStorage.getItem(nameCacheKey);
    if (cachedName) {
      setBusinessName(cachedName);
    }

    const loadBranding = async () => {
      try {
        const branding = await fetchBusinessBranding(controller.signal);
        if (branding.logoUrl) {
          setLogoSrc(branding.logoUrl);
          sessionStorage.setItem(logoCacheKey, branding.logoUrl);
        }
        setBusinessName(branding.businessName || DEFAULT_BUSINESS_NAME);
        sessionStorage.setItem(nameCacheKey, branding.businessName || DEFAULT_BUSINESS_NAME);
      } catch {
      }
    };

    loadBranding();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <Link to="/admin/orders" className="inline-flex items-center mb-2">
          <img
            src={logoSrc}
            alt={businessName}
            className="h-12 w-auto"
            onError={() => setLogoSrc(logo)}
          />
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {isDemoMode && (
          <p className="mt-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Demo mode active · showing sample data
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link to="/admin/orders">Live orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/menu">Menu</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/settings">Hours</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/analytics">Analytics</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/content">Content</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/promotions">Promotions</Link>
        </Button>
        {adminRole === "admin" && (
          <Button variant="outline" asChild>
            <Link to="/admin/whatsapp">WhatsApp</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/admin/payments">Payments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/users">Users</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/logs">Logs</Link>
        </Button>
        <Button variant="outline" onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
};
