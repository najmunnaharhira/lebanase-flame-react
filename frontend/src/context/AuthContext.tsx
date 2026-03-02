import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      return result.user;
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
