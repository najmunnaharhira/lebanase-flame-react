import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBusinessName } from "@/hooks/useBusinessName";

const isStrongPassword = (password: string) => {
  return password.trim().length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const businessName = useBusinessName();

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast({ title: "Signed in", description: `Welcome to ${businessName}.` });
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password too short", description: "Password must be at least 6 characters long." });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        toast({ title: "Signed in", description: `Welcome back to ${businessName}.` });
      } else {
        if (!isStrongPassword(password)) {
          toast({
            variant: "destructive",
            title: "Weak password",
            description: "Use at least 6 characters with letters and numbers.",
          });
          setIsSubmitting(false);
          return;
        }
        await signUp(name, email, password);
        toast({ title: "Account created", description: "Your account is ready." });
      }
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 md:py-16">
        <div className="max-w-md mx-auto bg-card rounded-2xl shadow-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Sign in to manage your addresses and orders."
              : `Join ${businessName} to save your details and track orders.`}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground">At least 6 characters with letters and numbers.</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" variant="flame" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            {mode === "login" && (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.76 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.93S8.78 6.62 12 6.62c1.83 0 3.06.78 3.76 1.45l2.56-2.46C16.67 4.1 14.53 3.2 12 3.2 7.03 3.2 3 7.27 3 12.3s4.03 9.1 9 9.1c5.2 0 8.65-3.65 8.65-8.79 0-.59-.06-1.04-.15-1.51Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M3.96 7.95 6.4 9.74c.66-1.97 2.51-3.38 4.6-3.38 1.83 0 3.06.78 3.76 1.45l2.56-2.46C16.67 4.1 14.53 3.2 12 3.2c-3.46 0-6.43 2-8.04 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M12 21.4c2.46 0 4.53-.82 6.04-2.22l-2.79-2.3c-.75.52-1.74.88-3.25.88-3.58 0-5.11-2.9-5.35-4.4l-2.5 1.92C5.75 19.25 8.66 21.4 12 21.4Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.96 7.95A9.2 9.2 0 0 0 3 12.3c0 1.56.38 3.03 1.05 4.3l2.5-1.92a5.95 5.95 0 0 1 0-4.76L3.96 7.95Z"
                    fill="#FBBC05"
                  />
                </svg>
                {isGoogleSubmitting ? "Connecting..." : "Continue with Google"}
              </Button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode("signup")}
              >
                Need an account? Sign up
              </button>
            ) : (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode("login")}
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
