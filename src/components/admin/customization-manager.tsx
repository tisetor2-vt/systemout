"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StoreBanner, StoreSettings } from "@/lib/types";

const defaultSettings: StoreSettings = {
  id: "",
  store_name: "Minha Loja",
  logo_url: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  custom_domain: "",
  theme: "light",
  header_top_text: "",
  header_bottom_text: "",
  footer_text: "",
  delivery_deadline: "",
  exchange_policy: "",
  contact_text: "",
  about_text: "",
  links_json: {},
};

export function CustomizationManager() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  async function load() {
    const supabase = createClient();
    if (!supabase) return;

    const [{ data: sData }, { data: bData }] = await Promise.all([
      supabase.from("store_settings").select("*").limit(1).maybeSingle(),
      supabase.from("store_banners").select("*").order("sort_order"),
    ]);

    if (sData) setSettings(sData as StoreSettings);
    if (bData) setBanners(bData as StoreBanner[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function uploadToCatalog(folder: string, file: File) {
    const supabase = createClient();
    if (!supabase) return "";
    const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { error } = await supabase.storage.from("catalog").upload(path, file, { upsert: false });
    if (error) throw error;
    return supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl;
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.info("Configure o Supabase para salvar dados reais.");
      return;
    }

    let logoUrl = settings.logo_url || null;
    if (logoFile) logoUrl = await uploadToCatalog("branding", logoFile);

    const payload = {
      ...settings,
      logo_url: logoUrl,
      links_json: settings.links_json || {},
    };

    if (settings.id) {
      const { error } = await supabase.from("store_settings").update(payload).eq("id", settings.id);
      if (error) {
        toast.error("Erro ao atualizar personalizacao.");
        return;
      }
    } else {
      const { error } = await supabase.from("store_settings").insert(payload);
      if (error) {
        toast.error("Erro ao criar configuracao da loja.");
        return;
      }
    }

    toast.success("Personalizacao salva.");
    setLogoFile(null);
    await load();
  }

  async function addBanner(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase || !bannerImage) {
      toast.info("Selecione a imagem do banner.");
      return;
    }

    const imageUrl = await uploadToCatalog("banners", bannerImage);
    const { error } = await supabase.from("store_banners").insert({
      title: bannerTitle || null,
      link_url: bannerLink || null,
      image_url: imageUrl,
      sort_order: banners.length,
      active: true,
    });

    if (error) {
      toast.error("Erro ao salvar banner.");
      return;
    }

    toast.success("Banner adicionado.");
    setBannerTitle("");
    setBannerLink("");
    setBannerImage(null);
    await load();
  }

  async function removeBanner(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from("store_banners").delete().eq("id", id);
    await load();
  }

  async function resetVisitCounter() {
    const supabase = createClient();
    if (!supabase || !settings.id) return;
    const { error } = await supabase
      .from("store_settings")
      .update({
        links_json: {
          ...(settings.links_json || {}),
          visit_counter: 0,
        },
      })
      .eq("id", settings.id);
    if (error) {
      toast.error("Erro ao zerar contador de visitas.");
      return;
    }
    toast.success("Contador de visitas zerado.");
    await load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Personalizacao</h1>
      <section className="admin-card grid gap-3 p-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-zinc-700">Aparencia da aba da loja</p>
          <p className="text-xs text-zinc-500">Deixe o visual mais profissional e amigavel para mobile.</p>
          <div className="mt-3 rounded-xl border bg-zinc-50 p-3">
            <p className="text-sm font-medium">{settings.store_name || "Minha Loja"}</p>
            <p className="text-xs text-zinc-500">{settings.header_top_text || "Mensagem de boas-vindas da loja"}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border bg-white px-2 py-1 text-xs">
              <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
              Preview responsivo
            </div>
          </div>
        </div>
        <div className="flex items-end justify-start md:justify-end">
          <button type="button" onClick={() => void resetVisitCounter()} className="admin-btn border">
            <RotateCcw className="mr-1 inline h-4 w-4" />
            Zerar contador de visitas
          </button>
        </div>
      </section>

      <form className="grid gap-3 rounded-xl border p-4 md:grid-cols-2" onSubmit={(e) => void saveSettings(e)}>
        <input className="rounded-lg border px-3 py-2" placeholder="Nome da loja" value={settings.store_name || ""} onChange={(e) => setSettings((s) => ({ ...s, store_name: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="WhatsApp" value={settings.whatsapp || ""} onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="Instagram" value={settings.instagram || ""} onChange={(e) => setSettings((s) => ({ ...s, instagram: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="Facebook" value={settings.facebook || ""} onChange={(e) => setSettings((s) => ({ ...s, facebook: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="URL personalizada" value={settings.custom_domain || ""} onChange={(e) => setSettings((s) => ({ ...s, custom_domain: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="Prazo de entrega" value={settings.delivery_deadline || ""} onChange={(e) => setSettings((s) => ({ ...s, delivery_deadline: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="Cabecalho superior" value={settings.header_top_text || ""} onChange={(e) => setSettings((s) => ({ ...s, header_top_text: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" placeholder="Cabecalho inferior" value={settings.header_bottom_text || ""} onChange={(e) => setSettings((s) => ({ ...s, header_bottom_text: e.target.value }))} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Rodape" value={settings.footer_text || ""} onChange={(e) => setSettings((s) => ({ ...s, footer_text: e.target.value }))} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Trocas" value={settings.exchange_policy || ""} onChange={(e) => setSettings((s) => ({ ...s, exchange_policy: e.target.value }))} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Contato" value={settings.contact_text || ""} onChange={(e) => setSettings((s) => ({ ...s, contact_text: e.target.value }))} />
        <textarea className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Sobre a loja" value={settings.about_text || ""} onChange={(e) => setSettings((s) => ({ ...s, about_text: e.target.value }))} />
        <input className="rounded-lg border px-3 py-2" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
        <div className="sticky bottom-3 z-20 bg-white/90 p-2 backdrop-blur">
          <button className="admin-btn admin-btn-primary w-full" type="submit">Salvar personalizacao</button>
        </div>
      </form>

      <form className="grid gap-3 rounded-xl border p-4 md:grid-cols-4" onSubmit={(e) => void addBanner(e)}>
        <input className="rounded-lg border px-3 py-2" placeholder="Titulo" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" placeholder="Link" value={bannerLink} onChange={(e) => setBannerLink(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" type="file" accept="image/*" onChange={(e) => setBannerImage(e.target.files?.[0] || null)} />
        <button className="rounded-lg border px-4 py-2 text-sm" type="submit">Adicionar banner</button>
      </form>

      <div className="space-y-2 rounded-xl border p-4">
        {banners.map((banner) => (
          <div key={banner.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{banner.title || "Banner"}</p>
              <p className="text-xs text-zinc-500">{banner.link_url || "Sem link"}</p>
            </div>
            <button className="rounded-lg border px-3 py-1 text-sm" type="button" onClick={() => void removeBanner(banner.id)}>Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
