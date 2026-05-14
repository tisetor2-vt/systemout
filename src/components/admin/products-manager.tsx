"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, Palette, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { categories as fallbackCategories, products as fallbackProducts } from "@/lib/mock-data";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { Category, Product } from "@/lib/types";

const presetColors = ["#111827", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f8fafc"];

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category_id: "",
  material: "",
  sizes: "",
  featured: false,
  active: true,
  visible_in_catalog: true,
};

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
};

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newColor, setNewColor] = useState("#111827");
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<"list" | "form">("form");

  const canUpload = useMemo(() => images.length <= 4, [images.length]);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (!p.error && p.data) setProducts(p.data as Product[]);
    if (!c.error && c.data) setCategories(c.data as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeTable("products", () => void load());
    return () => unsub();
  }, [load]);

  async function uploadFiles(): Promise<string[]> {
    const supabase = createClient();
    if (!supabase || images.length === 0) return [];

    const links: string[] = [];
    for (const file of images.slice(0, 4)) {
      const path = `products/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("catalog").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog").getPublicUrl(path);
      links.push(data.publicUrl);
    }
    return links;
  }

  function startEdit(product: Product) {
    setOpenSection("form");
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      stock: Number(product.stock),
      category_id: product.category_id || "",
      material: product.material || "",
      sizes: (product.sizes || []).join(","),
      featured: product.featured,
      active: product.active,
      visible_in_catalog: product.visible_in_catalog,
    });
    setColorTags(product.colors || []);
    setImages([]);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setColorTags([]);
    setImages([]);
    setNewColor("#111827");
  }

  function addColor(value: string) {
    const color = value.trim().toLowerCase();
    if (!color || colorTags.includes(color)) return;
    setColorTags((prev) => [...prev, color]);
  }

  async function pickFromScreen() {
    const anyWindow = window as EyeDropperWindow;
    if (!anyWindow.EyeDropper) {
      toast.info("Pinça não suportada neste navegador.");
      return;
    }

    try {
      const picker = new anyWindow.EyeDropper();
      const result = await picker.open();
      setNewColor(result.sRGBHex);
      addColor(result.sRGBHex);
    } catch {
      // user canceled
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canUpload) {
      toast.error("Envie no máximo 4 imagens por produto.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast.info("Configure o Supabase para salvar dados reais.");
      return;
    }

    setSaving(true);
    try {
      const uploaded = await uploadFiles();
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: form.category_id || null,
        material: form.material || null,
        sizes: form.sizes ? form.sizes.split(",").map((v) => v.trim()).filter(Boolean) : [],
        colors: colorTags,
        featured: form.featured,
        active: form.active,
        visible_in_catalog: form.visible_in_catalog,
      };

      if (editingId) {
        const current = products.find((item) => item.id === editingId);
        const image_urls = uploaded.length ? uploaded : current?.image_urls || [];
        const { error } = await supabase.from("products").update({ ...payload, image_urls }).eq("id", editingId);
        if (error) throw error;
        toast.success("Produto atualizado.");
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, image_urls: uploaded });
        if (error) throw error;
        toast.success("Produto criado com sucesso.");
      }

      resetForm();
      await load();
    } catch {
      toast.error("Erro ao salvar produto.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir o produto.");
      return;
    }
    toast.success("Produto removido.");
    await load();
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase().trim()),
      ),
    [products, search],
  );

  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Produtos</h1>
          <p className="text-sm text-zinc-500">Cadastro inteligente com variações visuais e fluxo rápido.</p>
        </div>
        {editingId ? (
          <button className="admin-btn border" onClick={resetForm} type="button">Cancelar edição</button>
        ) : null}
      </div>

      <section className="admin-card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b bg-zinc-50 px-4 py-3 text-left text-sm font-semibold"
          onClick={() => setOpenSection((prev) => (prev === "list" ? "form" : "list"))}
        >
          Produtos Cadastrados
          <ChevronDown className={`h-4 w-4 transition ${openSection === "list" ? "rotate-180" : ""}`} />
        </button>
        {openSection === "list" ? (
          <div>
            <div className="border-b p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-input pl-9"
                  placeholder="Buscar produto cadastrado para editar"
                />
              </div>
            </div>
            {loading ? <p className="p-4 text-sm text-zinc-500">Carregando...</p> : null}
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-zinc-500">Estoque: {product.stock} | R$ {Number(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(product)} className="admin-btn border" type="button">Editar</button>
                    <button onClick={() => void remove(product.id)} className="admin-btn border" type="button">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-card overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b bg-zinc-50 px-4 py-3 text-left text-sm font-semibold"
          onClick={() => setOpenSection((prev) => (prev === "form" ? "list" : "form"))}
        >
          Adicionar Novo Produto
          <ChevronDown className={`h-4 w-4 transition ${openSection === "form" ? "rotate-180" : ""}`} />
        </button>
        {openSection === "form" ? (
      <form onSubmit={onSubmit} className="grid gap-3 p-5 md:grid-cols-2">
        <input className="admin-input" placeholder="Nome" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
        <input className="admin-input" placeholder="Preço" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))} required />
        <textarea className="admin-input md:col-span-2" placeholder="Descrição" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        <input className="admin-input" placeholder="Estoque" type="number" min="0" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))} />
        <select className="admin-input" value={form.category_id} onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value }))}>
          <option value="">Sem categoria</option>
          {categories.map((category) => (<option key={category.id} value={category.id}>{category.name}</option>))}
        </select>
        <input className="admin-input" placeholder="Material" value={form.material} onChange={(e) => setForm((s) => ({ ...s, material: e.target.value }))} />
        <input className="admin-input" placeholder="Tamanhos (P,M,G)" value={form.sizes} onChange={(e) => setForm((s) => ({ ...s, sizes: e.target.value }))} />
        <input className="admin-input" type="file" multiple accept="image/*" onChange={(e) => setImages(Array.from(e.target.files || []))} />

        <div className="md:col-span-2">
          <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4 text-violet-600" />Gerenciamento de cores</label>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => addColor(color)}
                  className="h-8 w-8 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input type="color" className="h-10 w-12 cursor-pointer rounded-lg border" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
              <button type="button" className="admin-btn border" onClick={() => addColor(newColor)}>
                <Plus className="mr-1 inline h-4 w-4" />Adicionar cor
              </button>
              <button type="button" className="admin-btn border" onClick={() => void pickFromScreen()}>
                <Eye className="mr-1 inline h-4 w-4" />Pinça visual
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {colorTags.length === 0 ? <p className="text-xs text-zinc-500">Nenhuma cor adicionada.</p> : null}
              {colorTags.map((color) => (
                <span key={color} className="inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1 text-xs">
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                  {color}
                  <button type="button" onClick={() => setColorTags((prev) => prev.filter((c) => c !== color))}>
                    <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))} /> Destaque</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm((s) => ({ ...s, active: e.target.checked }))} /> Ativo</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visible_in_catalog} onChange={(e) => setForm((s) => ({ ...s, visible_in_catalog: e.target.checked }))} /> Mostrar no catálogo</label>
        </div>

        <div className="sticky bottom-3 z-20 bg-white/90 p-2 backdrop-blur md:col-span-2">
          <button disabled={saving} className="admin-btn admin-btn-primary w-full" type="submit">
            {saving ? "Salvando..." : editingId ? "Atualizar produto" : "Salvar produto"}
          </button>
        </div>
      </form>
        ) : null}
      </section>
    </div>
  );
}
