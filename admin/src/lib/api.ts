import { getAdminAuthHeaders } from "@/lib/adminAuth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
export const DEFAULT_BUSINESS_NAME = "Lebanese Flames";

export interface BusinessBranding {
  businessName: string;
  logoUrl: string;
}

export function resolveAssetUrl(value: string | null | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${API_BASE_URL}${trimmed}`;
  }

  if (trimmed.startsWith("uploads/")) {
    return `${API_BASE_URL}/${trimmed}`;
  }

  return trimmed;
}

export async function fetchBusinessBranding(signal?: AbortSignal): Promise<BusinessBranding> {
  const response = await fetch(`${API_BASE_URL}/settings/business`, { signal });
  if (!response.ok) {
    throw new Error("Failed to load business branding");
  }

  const data = await response.json();
  return {
    businessName: String(data?.businessName || "").trim() || DEFAULT_BUSINESS_NAME,
    logoUrl: resolveAssetUrl(data?.logoUrl || ""),
  };
}

export async function fetchBusinessLogoUrl(signal?: AbortSignal): Promise<string> {
  const branding = await fetchBusinessBranding(signal);
  return branding.logoUrl;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Request failed";
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed?.message || errorText || "Request failed";
    } catch {
      errorMessage = errorText || "Request failed";
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
