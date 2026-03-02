import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAdminSession } from "@/lib/adminAuth";
import { apiRequest } from "@/lib/api";

interface AdminLoginResponse {
  accessToken: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    role: "admin" | "moderator" | "editor" | "user";
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
      navigate("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid admin credentials.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10 md:py-16">
        <div className="max-w-md mx-auto bg-card rounded-2xl shadow-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Admin access
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to manage the menu and upload new items.
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
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="flame" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Checking..." : "Sign In"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
