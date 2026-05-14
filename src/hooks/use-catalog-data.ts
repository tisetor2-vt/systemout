"use client";

import { useCallback, useEffect, useState } from "react";
import { categories as fallbackCategories, products as fallbackProducts } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { Category, Product, StoreBanner, StoreSettings } from "@/lib/types";

const fallbackSettings: StoreSettings = {
  id: "",
  store_name: "Catalogo Premium",
  whatsapp: "5500000000000",
  footer_text: "Todos os direitos reservados.",
};

export function useCatalogData() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [settings, setSettings] = useState<StoreSettings>(fallbackSettings);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [productsRes, categoriesRes, settingsRes, bannersRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("visible_in_catalog", true)
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("store_settings").select("*").limit(1).maybeSingle(),
      supabase.from("store_banners").select("*").eq("active", true).order("sort_order"),
    ]);

    if (!productsRes.error && productsRes.data) setProducts(productsRes.data as Product[]);
    if (!categoriesRes.error && categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    if (!settingsRes.error && settingsRes.data) setSettings(settingsRes.data as StoreSettings);
    if (!bannersRes.error && bannersRes.data) setBanners(bannersRes.data as StoreBanner[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const unsubProducts = subscribeTable("products", () => void load());
    const unsubCategories = subscribeTable("categories", () => void load());
    const unsubSettings = subscribeTable("store_settings", () => void load());
    const unsubBanners = subscribeTable("store_banners", () => void load());

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
      unsubBanners();
    };
  }, [load]);

  return { products, categories, settings, banners, loading, reload: load };
}
