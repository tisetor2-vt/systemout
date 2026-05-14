"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);

  return (
    <article className="group rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-100 transition hover:shadow-lg dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <Image
          src={product.image_urls[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          loading="lazy"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1 p-2">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-5">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-zinc-500">{product.description}</p>
        <div className="flex items-end justify-between gap-2">
          <strong className="text-2xl font-extrabold text-yellow-500">R$ {product.price.toFixed(2)}</strong>
          <button
            type="button"
            className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold text-zinc-900"
            onClick={() => {
              addItem(product);
              toast.success("Produto adicionado ao carrinho");
            }}
          >
            <span className="inline-flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              comprar
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
