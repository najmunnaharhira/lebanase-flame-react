import { useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
