"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { FinanceEntry } from "@/lib/types";
import { toast } from "sonner";

export function FinanceManager() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [type, setType] = useState<"entrada" | "saida">("entrada");
  const [category, setCategory] = useState("geral");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;

    let query = supabase.from("financial_entries").select("*").order("occurred_on", { ascending: false });
    if (from) query = query.gte("occurred_on", from);
    if (to) query = query.lte("occurred_on", to);

    const { data } = await query;
    if (data) setEntries(data as FinanceEntry[]);
  }, [from, to]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeTable("financial_entries", () => void load());
    return () => unsubscribe();
  }, [load]);

  const summary = useMemo(() => {
    const entradas = entries.filter((e) => e.type === "entrada").reduce((acc, e) => acc + Number(e.amount), 0);
    const saidas = entries.filter((e) => e.type === "saida").reduce((acc, e) => acc + Number(e.amount), 0);
    return { entradas, saidas, lucro: entradas - saidas };
  }, [entries]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.info("Configure o Supabase para salvar dados reais.");
      return;
    }

    const { error } = await supabase.from("financial_entries").insert({
      type,
      category,
      description: description || null,
      amount,
      occurred_on: new Date().toISOString().slice(0, 10),
    });

    if (error) {
      toast.error("Erro ao lancar movimentacao.");
      return;
    }

    toast.success("Movimentacao registrada.");
    setDescription("");
    setAmount(0);
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="admin-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Financeiro</h1>
        <p className="text-sm text-zinc-500">Controle de entradas e saídas com experiência moderna e responsiva.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="admin-card p-4"><p className="text-sm text-zinc-500">Entradas</p><strong className="text-emerald-600">R$ {summary.entradas.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-sm text-zinc-500">Saídas</p><strong className="text-rose-600">R$ {summary.saidas.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-sm text-zinc-500">Saldo</p><strong className="text-indigo-600">R$ {summary.lucro.toFixed(2)}</strong></article>
      </div>

      <form onSubmit={onSubmit} className="admin-card grid gap-3 p-4 md:grid-cols-5">
        <select className="rounded-lg border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as "entrada" | "saida")}> 
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input className="rounded-lg border px-3 py-2" placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className="rounded-lg border px-3 py-2" type="number" min="0" step="0.01" placeholder="Valor" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <input className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="sticky bottom-3 z-20 bg-white/90 p-2 backdrop-blur md:col-span-5">
          <button className="admin-btn admin-btn-primary w-full" type="submit">Registrar movimentação</button>
        </div>
      </form>

      <div className="admin-card p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="rounded-lg border px-3 py-2 text-sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => void load()}>Filtrar</button>
        </div>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3">
              <div>
                <p className="text-sm font-medium">{entry.category}</p>
                <p className="text-xs text-zinc-500">{entry.description || "Sem descrição"} - {entry.occurred_on}</p>
              </div>
              <p className={`rounded-full px-2 py-1 text-sm font-semibold ${entry.type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {entry.type === "entrada" ? "+" : "-"} R$ {Number(entry.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
