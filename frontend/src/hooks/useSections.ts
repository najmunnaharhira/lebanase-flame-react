import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface Section {
  id: number;
  section_key: string;
  title: string;
  content: string;
  settings: any;
  is_active: boolean;
  sort_order: number;
}

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/sections`)
      .then((res) => res.json())
      .then((data) => {
        setSections(Array.isArray(data) ? data.filter(s => s.is_active) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { sections, loading };
}
