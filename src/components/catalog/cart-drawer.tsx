"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useCart } from "@/hooks/use-cart";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.qty, 0),
    [items],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-black p-3 text-white shadow-lg dark:bg-white dark:text-black"
      >
        <ShoppingCart className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <aside
            className="ml-auto h-full w-full max-w-sm bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold">Carrinho</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.qty} x R$ {item.price.toFixed(2)}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="font-semibold">Total: R$ {total.toFixed(2)}</p>
              <button className="mt-3 w-full rounded-xl bg-black py-2 text-white dark:bg-white dark:text-black">
                Finalizar pedido
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
