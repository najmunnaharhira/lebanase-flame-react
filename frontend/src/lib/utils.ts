import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns null if the password is strong enough, or an error message if not. */
export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

/** Returns up to 2 initials from a display name or email string. */
export function getUserInitials(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}
