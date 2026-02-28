import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export const AuthModal = ({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password, name || undefined);
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to manage your addresses and orders."
            : "Join Lebanese Flames to save your details and track orders."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="modal-name">Name</Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
            <Input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <Button type="submit" variant="flame" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
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
