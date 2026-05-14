"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { categories as fallbackCategories } from "@/lib/mock-data";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { Category } from "@/lib/types";

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data as Category[]);
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeTable("categories", () => void load());
    return () => unsub();
  }, [load]);

  async function upload(): Promise<string | null> {
    const supabase = createClient();
    if (!supabase || !image) return null;
    const path = `categories/${Date.now()}-${image.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("catalog").upload(path, image, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl;
  }

  function startEdit(item: Category) {
    setEditingId(item.id);
    setName(item.name);
    setImage(null);
  }

  function reset() {
    setEditingId(null);
    setName("");
    setImage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.info("Configure o Supabase para salvar dados reais.");
      return;
    }

    const imageUrl = await upload();

    if (editingId) {
      const current = categories.find((c) => c.id === editingId);
      const { error } = await supabase
        .from("categories")
        .update({ name, image_url: imageUrl ?? current?.image_url ?? null })
        .eq("id", editingId);
      if (error) {
        toast.error("Erro ao atualizar categoria.");
        return;
      }
      toast.success("Categoria atualizada.");
    } else {
      const { error } = await supabase.from("categories").insert({ name, image_url: imageUrl });
      if (error) {
        toast.error("Erro ao criar categoria.");
        return;
      }
      toast.success("Categoria criada.");
    }

    reset();
    await load();
  }

  async function remove(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Nao foi possivel excluir a categoria.");
      return;
    }
    toast.success("Categoria removida.");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        {editingId ? <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={reset}>Cancelar edicao</button> : null}
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border p-4 md:grid-cols-3">
        <input className="rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" required />
        <input className="rounded-lg border px-3 py-2" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black" type="submit">{editingId ? "Atualizar" : "Salvar"}</button>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              {category.image_url ? (
                <Image src={category.image_url} alt={category.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              )}
              <p className="font-medium">{category.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(category)} className="rounded-lg border px-3 py-1 text-sm" type="button">Editar</button>
              <button onClick={() => void remove(category.id)} className="rounded-lg border px-3 py-1 text-sm" type="button">Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
