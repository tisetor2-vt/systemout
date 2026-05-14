"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { StoreSettings } from "@/lib/types";

const defaultSettings: StoreSettings = {
  id: "",
  store_name: "Minha Loja",
  theme: "light",
  links_json: {},
};

export function SettingsManager() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
    if (error) {
      toast.error("Não foi possível carregar configurações.");
      return;
    }
    if (data) setSettings(data as StoreSettings);
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeTable("store_settings", () => void load());
    return () => unsub();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase não configurado.");
      return;
    }
    const payload = {
      ...settings,
      links_json: settings.links_json || {},
    };
    const result = settings.id
      ? await supabase.from("store_settings").update(payload).eq("id", settings.id)
      : await supabase.from("store_settings").insert(payload);
    if (result.error) {
      toast.error("Falha ao salvar configurações.");
      return;
    }
    toast.success("Configurações salvas.");
    await load();
  }

  return (
    <div className="space-y-4">
      <section className="admin-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Configurações da Loja</h1>
        <p className="text-sm text-zinc-500">Configure comportamento do sistema, comunicação visual e parâmetros globais.</p>
      </section>

      <form onSubmit={onSubmit} className="admin-card grid gap-3 p-4 md:grid-cols-2">
        <input className="admin-input" placeholder="Nome da loja" value={settings.store_name || ""} onChange={(e) => setSettings((prev) => ({ ...prev, store_name: e.target.value }))} />
        <select className="admin-input" value={settings.theme || "light"} onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value }))}>
          <option value="light">Tema claro</option>
          <option value="dark">Tema escuro</option>
        </select>
        <input className="admin-input" placeholder="URL personalizada" value={settings.custom_domain || ""} onChange={(e) => setSettings((prev) => ({ ...prev, custom_domain: e.target.value }))} />
        <input className="admin-input" placeholder="WhatsApp da loja" value={settings.whatsapp || ""} onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp: e.target.value }))} />
        <textarea className="admin-input md:col-span-2" placeholder="Mensagem topo da loja" value={settings.header_top_text || ""} onChange={(e) => setSettings((prev) => ({ ...prev, header_top_text: e.target.value }))} />
        <textarea className="admin-input md:col-span-2" placeholder="Mensagem de rodapé" value={settings.footer_text || ""} onChange={(e) => setSettings((prev) => ({ ...prev, footer_text: e.target.value }))} />
        <div className="sticky bottom-3 z-20 bg-white/90 p-2 backdrop-blur md:col-span-2">
          <button className="admin-btn admin-btn-primary w-full" type="submit">Salvar configurações</button>
        </div>
      </form>
    </div>
  );
}
