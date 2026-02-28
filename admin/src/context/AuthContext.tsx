import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
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
    signUp: async (email, password) => {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    },
    signIn: async (email, password) => {
      const result = await signInWithEmailAndPassword(auth, email, password);
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
