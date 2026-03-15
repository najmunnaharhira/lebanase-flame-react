import logo from "@/assets/logo.png";
// import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAdminSession } from "@/lib/adminAuth";
import { apiRequest, DEFAULT_BUSINESS_NAME, fetchBusinessBranding } from "@/lib/api";
// import { auth } from "@/lib/firebase";

const DEMO_EMAIL = "demo@lebaneseflames.com";
const DEMO_PASSWORD = "demo";
const DEMO_ADMIN = {
  accessToken: "demo-token",
  user: {
    id: 0,
    name: "Demo Admin",
    email: DEMO_EMAIL,
    role: "admin" as "admin",
    profileImage: null,
  },
  permissions: ["all"],
};

interface AdminLoginResponse {
  accessToken: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    role: "admin" | "manager" | "moderator" | "editor" | "user";
    profileImage?: string | null;
  };
  permissions: string[];
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [logoSrc, setLogoSrc] = useState(logo);
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);
  const [demoMode, setDemoMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await apiRequest<AdminLoginResponse>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAdminSession({
        accessToken: response.accessToken,
        user: response.user,
        permissions: response.permissions || [],
      });
      // Redirect based on role
      if (response.user.role === "editor") {
        navigate("/editor");
      } else if (response.user.role === "moderator") {
        navigate("/lmoderstor");
      } else {
        navigate("/admin/orders");
      }
    } catch (err) {
      // If backend is unreachable (network error), allow demo login
      if (
        (email === DEMO_EMAIL || email === "hello@lebaneseflames.com") &&
        (err instanceof TypeError || (err && err.message && err.message.includes("Failed to fetch")))
      ) {
        setAdminSession(DEMO_ADMIN);
        setDemoMode(true);
        navigate("/admin/orders");
        setIsSubmitting(false);
        return;
      }
      setError(err instanceof Error ? err.message : "Invalid admin credentials.");
    }
    setIsSubmitting(false);
  };

  // Google login is handled by backend OAuth only (no Firebase client)
  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleSubmitting(true);
    try {
      // Open backend Google OAuth login page in a new window
      const popup = window.open(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/auth/google?admin=1`,
        "google_oauth",
        "width=500,height=600"
      );
      if (!popup) throw new Error("Popup blocked. Please allow popups and try again.");

      // Listen for message from popup with token
      window.addEventListener(
        "message",
        async (event) => {
          if (event.origin !== (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000")) return;
          if (event.data?.accessToken && event.data?.user) {
            setAdminSession({
              accessToken: event.data.accessToken,
              user: event.data.user,
              permissions: event.data.permissions || [],
            });
            popup.close();
            navigate("/admin/orders");
          }
        },
        { once: true }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {demoMode && (
        <div className="bg-yellow-200 text-yellow-900 text-center py-2 font-bold">
          Demo Mode: Backend not connected. Data is not live.
        </div>
      )}
      <main className="container py-10 md:py-16">
        <div className="max-w-md mx-auto bg-card rounded-2xl shadow-card p-6 md:p-8">
          <div className="mb-5 flex justify-center">
            <img
              src={logoSrc}
              alt={businessName}
              className="h-16 w-auto"
              onError={() => setLogoSrc(logo)}
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Admin access
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to manage {businessName} menu and upload new items.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    // Eye-off SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.13 0 2.21.19 3.22.54M19.07 4.93A9.97 9.97 0 0121 12c0 1.61-.39 3.13-1.08 4.44M9.88 9.88a3 3 0 104.24 4.24" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="flame" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Checking..." : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2"
              disabled={isGoogleSubmitting}
              onClick={handleGoogleSignIn}
            >
              {isGoogleSubmitting ? "Connecting..." : "Continue with Google"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
