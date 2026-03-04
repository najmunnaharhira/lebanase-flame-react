export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
export const DEFAULT_BUSINESS_NAME = "Lebanese Flames";

export interface BusinessBranding {
  businessName: string;
  logoUrl: string;
}

export interface PublicPaymentSettings {
  stripePublishableKey: string;
  cloverEnabled: boolean;
}

export function resolveMenuImageUrl(image: string | null | undefined): string {
  const trimmed = (image || "").trim();
  if (!trimmed) return "";

  const normalizeLocalhostAssetUrl = (value: string): string => {
    try {
      const parsedAsset = new URL(value);
      const isLocalAsset = ["localhost", "127.0.0.1", "::1"].includes(parsedAsset.hostname);
      const isClientOnDifferentHost =
        typeof window !== "undefined" &&
        !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

      if (isLocalAsset && isClientOnDifferentHost) {
        const protocol = window.location.protocol || parsedAsset.protocol;
        const host = window.location.hostname;
        const port = parsedAsset.port ? `:${parsedAsset.port}` : "";
        return `${protocol}//${host}${port}${parsedAsset.pathname}${parsedAsset.search}${parsedAsset.hash}`;
      }
    } catch {
      return value;
    }

    return value;
  };

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return normalizeLocalhostAssetUrl(trimmed);
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
    logoUrl: resolveMenuImageUrl(data?.logoUrl || ""),
  };
}

export async function fetchPublicPaymentSettings(signal?: AbortSignal): Promise<PublicPaymentSettings> {
  const response = await fetch(`${API_BASE_URL}/settings/business`, { signal });
  if (!response.ok) {
    throw new Error("Failed to load payment settings");
  }

  const data = await response.json();
  const paymentSettings = data?.paymentSettings || {};

  return {
    stripePublishableKey: String(paymentSettings?.stripePublishableKey || "").trim(),
    cloverEnabled: Boolean(paymentSettings?.cloverEnabled),
  };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
