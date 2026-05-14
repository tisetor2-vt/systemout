"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Info, Menu, Search, SlidersHorizontal } from "lucide-react";
import { CartDrawer } from "@/components/catalog/cart-drawer";
import { ProductCard } from "@/components/catalog/product-card";
import { SearchBar } from "@/components/catalog/search-bar";
import type { Category, Product, StoreBanner, StoreSettings } from "@/lib/types";

export function CatalogPage({
  products,
  categories,
  settings,
  banners,
  loading,
}: {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  banners: StoreBanner[];
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const byName = product.name.toLowerCase().includes(search.toLowerCase());
        const byCategory = selectedCategory ? product.category_id === selectedCategory : true;
        return byName && byCategory && product.active && product.visible_in_catalog;
      }),
    [products, search, selectedCategory],
  );

  const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => {
    setVisibleCount(12);
  }, [search, selectedCategory]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-white px-4 pb-20 pt-3">
      {settings.header_top_text ? (
        <p className="rounded-xl border p-2 text-center text-xs text-zinc-600">{settings.header_top_text}</p>
      ) : null}

      <header className="sticky top-0 z-20 bg-white/95 py-2 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black tracking-tight text-indigo-900">
            {settings.store_name || "Laura :)"}
          </h1>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-zinc-500 md:flex">
              <Search className="h-4 w-4" />
              <span className="text-xs">Busca</span>
            </div>
            <button className="rounded-full bg-indigo-900 p-2 text-white" type="button">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <button className="rounded-full border p-2" type="button">
              <Info className="h-4 w-4" />
            </button>
            <button className="rounded-full border p-2" type="button">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        {settings.header_bottom_text ? <p className="mb-2 text-xs text-zinc-500">{settings.header_bottom_text}</p> : null}
        <SearchBar value={search} onChange={setSearch} />
      </header>

      {banners.length ? (
        <section className="flex gap-3 overflow-x-auto pb-1">
          {banners.map((banner) => (
            <a key={banner.id} href={banner.link_url || "#"} className="relative h-44 min-w-[92%] overflow-hidden rounded-xl md:h-80 md:min-w-[45%]">
              <Image src={banner.image_url} alt={banner.title || "Banner"} fill className="object-cover" />
            </a>
          ))}
        </section>
      ) : (
        <section className="relative h-44 overflow-hidden rounded-xl bg-yellow-400 md:h-80">
          <Image
            src="https://images.unsplash.com/photo-1517336714739-489689fd1ca8"
            alt="Banner"
            fill
            className="object-cover opacity-90"
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-2xl font-bold text-zinc-700">Categorias</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setSelectedCategory(null)} type="button">Todos</button>
        {categories.map((category) => (
          <button
            key={category.id}
            className="flex min-w-24 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-center text-xs"
            onClick={() => setSelectedCategory(category.id)}
            type="button"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400">
              {category.image_url ? (
                <Image src={category.image_url} alt={category.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="text-xl">•</span>
              )}
            </span>
            <span className="line-clamp-2">{category.name}</span>
          </button>
        ))}
        </div>
      </section>

      {loading ? <div className="h-32 animate-pulse rounded-2xl bg-zinc-100" /> : null}

      <section>
        <h2 className="mb-3 text-3xl font-extrabold text-yellow-500">Promocoes</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        </div>
        {filtered.length > visibleCount ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 12)}
              className="rounded-xl border px-4 py-2 text-sm font-medium"
            >
              Carregar mais produtos
            </button>
          </div>
        ) : null}
      </section>

      <footer className="space-y-2 rounded-2xl border p-4 text-sm text-zinc-600">
        {settings.about_text ? <p>{settings.about_text}</p> : null}
        {settings.delivery_deadline ? <p>Prazo: {settings.delivery_deadline}</p> : null}
        {settings.exchange_policy ? <p>Trocas: {settings.exchange_policy}</p> : null}
        {settings.contact_text ? <p>Contato: {settings.contact_text}</p> : null}
        <p>{settings.footer_text || "Todos os direitos reservados."}</p>
      </footer>

      <a
        href={`https://wa.me/${settings.whatsapp || "5500000000000"}`}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        target="_blank"
        rel="noreferrer"
      >
        WhatsApp
      </a>
      <CartDrawer />
    </main>
  );
}
