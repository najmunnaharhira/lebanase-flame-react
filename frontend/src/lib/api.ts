export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function resolveMenuImageUrl(image: string | null | undefined): string {
  const trimmed = (image || "").trim();
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
    throw new Error(errorText || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
