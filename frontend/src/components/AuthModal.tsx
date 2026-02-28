import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { validatePassword } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    setMode("login");
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (mode === "signup") {
      const passwordError = validatePassword(password);
      if (passwordError) {
        toast.error(passwordError);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password, name);
        toast.success("Account created! Welcome to Lebanese Flames.");
      }
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          {mode === "login"
            ? "Sign in to manage your addresses and orders."
            : "Join Lebanese Flames to save your details and track orders."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="auth-name">Name</Label>
              <Input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                Min 6 characters, one uppercase letter, one number.
              </p>
            )}
          </div>

          <Button type="submit" variant="flame" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-2">
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
      </DialogContent>
    </Dialog>
  );
};
