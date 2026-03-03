import { useEffect, useState } from "react";
import { DEFAULT_BUSINESS_NAME, fetchBusinessBranding } from "@/lib/api";

const BUSINESS_NAME_CACHE_KEY = "adminBusinessNameCache";

export const useBusinessName = () => {
  const [businessName, setBusinessName] = useState(DEFAULT_BUSINESS_NAME);

  useEffect(() => {
    const cachedName = sessionStorage.getItem(BUSINESS_NAME_CACHE_KEY);
    if (cachedName) {
      setBusinessName(cachedName);
    }

    const controller = new AbortController();
    const loadBranding = async () => {
      try {
        const branding = await fetchBusinessBranding(controller.signal);
        const resolvedName = branding.businessName || DEFAULT_BUSINESS_NAME;
        setBusinessName(resolvedName);
        sessionStorage.setItem(BUSINESS_NAME_CACHE_KEY, resolvedName);
      } catch {
      }
    };

    loadBranding();
    return () => controller.abort();
  }, []);

  return businessName;
};
