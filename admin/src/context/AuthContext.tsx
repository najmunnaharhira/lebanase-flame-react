import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// AuthContext is now a stub (no Firebase in admin)
import React, { createContext } from "react";
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children as any;
export const useAuth = () => ({ user: null, isLoading: false });
