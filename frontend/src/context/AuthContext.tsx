import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import { API_BASE_URL } from "@/lib/api";
import { auth } from "@/lib/firebase";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapGoogleAuthError = (error: unknown) => {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/unauthorized-domain") {
      const domain =
        typeof window !== "undefined" ? window.location.host : "current domain";
      return `Google sign-in is not enabled for ${domain}. Add this domain in Firebase Console → Authentication → Settings → Authorized domains, then try again.`;
    }

    if (error.code === "auth/popup-blocked") {
      return "Popup was blocked by the browser. Allow popups for this site and try Google sign-in again.";
    }

    if (error.code === "auth/popup-closed-by-user") {
      return "Google sign-in was closed before completion. Please try again.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Google sign-in failed";
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    signUp: async (name, email, password) => {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      return result.user;
    },
    signIn: async (email, password) => {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      return result.user;
    },
    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // Step 1: Firebase popup — handle popup-specific errors separately
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (error) {
        throw new Error(mapGoogleAuthError(error));
      }

      // Step 2: Sync with backend — if this fails, clean up the Firebase session
      try {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = String(credential?.idToken || "").trim();
        const firebaseIdToken = await result.user.getIdToken();

        if (!idToken && !firebaseIdToken) {
          throw new Error("Google sign-in did not return an ID token");
        }

        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken, firebaseIdToken }),
        });

        if (!response.ok) {
          let message = "Failed to sign in with Google";
          try {
            const payload = await response.json();
            if (payload?.message) {
              message = String(payload.message);
            }
          } catch {
          }
          throw new Error(message);
        }

        return result.user;
      } catch (error) {
        // Backend sync failed — sign out of Firebase to keep state consistent
        try { await signOut(auth); } catch {}
        throw new Error(mapGoogleAuthError(error));
      }
    },
    signOutUser: () => signOut(auth),
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
