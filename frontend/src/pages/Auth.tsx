import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast({ title: "Signed in", description: "Welcome to Lebanese Flames." });
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
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        toast({ title: "Signed in", description: "Welcome back to Lebanese Flames." });
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
              : "Join Lebanese Flames to save your details and track orders."}
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
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
              >
                {isGoogleSubmitting ? "Connecting Google..." : "Continue with Google"}
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
