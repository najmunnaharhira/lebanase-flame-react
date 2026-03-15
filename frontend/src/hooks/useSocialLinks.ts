import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/social-links`)
      .then((res) => res.json())
      .then((data) => {
        setLinks(Array.isArray(data) ? data.filter(l => l.is_active) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { links, loading };
}
