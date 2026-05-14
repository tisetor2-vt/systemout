"use client";

import { useEffect } from "react";
import { CatalogPage } from "@/components/catalog/catalog-page";
import { useCatalogData } from "@/hooks/use-catalog-data";
import { createClient } from "@/lib/supabase/client";

export function CatalogShell() {
  const { products, categories, settings, banners, loading, reload } = useCatalogData();

  useEffect(() => {
    if (!settings.id || typeof window === "undefined") return;
    const key = `visit-counted:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;

    async function countVisit() {
      const supabase = createClient();
      if (!supabase) return;
      const current = Number((settings.links_json as { visit_counter?: number } | null)?.visit_counter || 0);
      await supabase
        .from("store_settings")
        .update({
          links_json: {
            ...(settings.links_json || {}),
            visit_counter: current + 1,
          },
        })
        .eq("id", settings.id);
      sessionStorage.setItem(key, "1");
      await reload();
    }

    void countVisit();
  }, [reload, settings.id, settings.links_json]);

  return (
    <CatalogPage
      products={products}
      categories={categories}
      settings={settings}
      banners={banners}
      loading={loading}
    />
  );
}
