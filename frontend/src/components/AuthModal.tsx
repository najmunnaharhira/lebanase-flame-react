import { FirebaseError } from "firebase/app";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const passwordHasMinLength = (password: string) => password.trim().length >= 6;
const passwordHasLetter = (password: string) => /[A-Za-z]/.test(password);
const passwordHasNumber = (password: string) => /\d/.test(password);

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signIn, signInWithGoogle, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode]
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (mode === "signup") {
      if (!passwordHasMinLength(password) || !passwordHasLetter(password) || !passwordHasNumber(password)) {
        toast({
          variant: "destructive",
          title: "Weak password",
          description: "Use at least 6 characters with letters and numbers.",
        });
        return;
      }

      if (!name.trim()) {
        toast({
          variant: "destructive",
          title: "Name required",
          description: "Please enter your name to create an account.",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        toast({ title: "Signed in", description: "Welcome back to Lebanese Flames." });
      } else {
        await signUp(name.trim(), email.trim(), password);
        toast({ title: "Account created", description: "Your account is ready." });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const defaultMessage = mode === "login" ? "Unable to sign in." : "Unable to create account.";
      const message = error instanceof FirebaseError ? error.message : defaultMessage;
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast({ title: "Signed in", description: "Welcome to Lebanese Flames." });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const message = error instanceof FirebaseError ? error.message : "Google sign-in failed.";
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: message,
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to manage your orders and checkout faster."
              : "Sign up to save your details and track orders."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
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
              autoComplete="email"
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">At least 6 characters with letters and numbers.</p>
            )}
          </div>

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

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline">
              Need an account? Sign up
            </button>
          ) : (
            <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
              Already have an account? Sign in
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
