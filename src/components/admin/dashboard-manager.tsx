"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, DollarSign, ShoppingBag, Users, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { FinanceEntry, Sale } from "@/lib/types";

type DayRow = { day: string; vendas: number; receitas: number; despesas: number };

export function DashboardManager() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const isoFrom = from.toISOString();

      const [{ data: salesData }, { data: entriesData }, { data: settingsData }] = await Promise.all([
        supabase.from("sales").select("*").gte("created_at", isoFrom).order("created_at", { ascending: true }),
        supabase.from("financial_entries").select("*").gte("created_at", isoFrom).order("created_at", { ascending: true }),
        supabase.from("store_settings").select("links_json").limit(1).maybeSingle(),
      ]);

      if (salesData) setSales(salesData as Sale[]);
      if (entriesData) setEntries(entriesData as FinanceEntry[]);
      const nextVisits = Number((settingsData as { links_json?: { visit_counter?: number } } | null)?.links_json?.visit_counter || 0);
      setVisits(nextVisits);
    }

    void load();
    const timer = setInterval(() => void load(), 30000);
    const unsubSales = subscribeTable("sales", () => void load());
    const unsubEntries = subscribeTable("financial_entries", () => void load());
    const unsubSettings = subscribeTable("store_settings", () => void load());
    return () => {
      clearInterval(timer);
      unsubSales();
      unsubEntries();
      unsubSettings();
    };
  }, []);

  const metrics = useMemo(() => {
    const faturamento = sales.reduce((acc, s) => acc + Number(s.total), 0);
    const vendas = sales.length;
    const entradas = entries.filter((e) => e.type === "entrada").reduce((acc, e) => acc + Number(e.amount), 0);
    const saidas = entries.filter((e) => e.type === "saida").reduce((acc, e) => acc + Number(e.amount), 0);

    return {
      faturamento,
      vendas,
      lucro: entradas - saidas,
      clientesOnline: Math.max(5, Math.round(vendas * 0.5)),
      entradas,
      saidas,
    };
  }, [entries, sales]);

  const daily = useMemo<DayRow[]>(() => {
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const key = d.toISOString().slice(0, 10);
      return { key, day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) };
    });

    return days.map(({ key, day }) => {
      const vendasDia = sales.filter((s) => (s.created_at || "").startsWith(key));
      const lancDia = entries.filter((e) => (e.occurred_on || "").startsWith(key));
      const receitas = lancDia.filter((e) => e.type === "entrada").reduce((a, b) => a + Number(b.amount), 0);
      const despesas = lancDia.filter((e) => e.type === "saida").reduce((a, b) => a + Number(b.amount), 0);
      return { day, vendas: vendasDia.reduce((a, b) => a + Number(b.total), 0), receitas, despesas };
    });
  }, [entries, sales]);

  const cards = [
    { label: "Visitas da loja", value: String(visits), icon: Activity, color: "text-blue-600" },
    { label: "Faturamento", value: `R$ ${metrics.faturamento.toFixed(2)}`, icon: DollarSign, color: "text-indigo-600" },
    { label: "Vendas", value: String(metrics.vendas), icon: ShoppingBag, color: "text-violet-600" },
    { label: "Clientes online", value: String(metrics.clientesOnline), icon: Users, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="admin-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">Visao geral em tempo real da operacao da loja.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, idx) => (
          <article key={card.label} className="admin-card admin-fade-up p-4" style={{ animationDelay: `${idx * 40}ms` }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-zinc-500">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <strong className="text-xl font-extrabold tracking-tight">{card.value}</strong>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> Atualizacao automatica
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="admin-card p-5">
          <h2 className="mb-3 text-lg font-bold">Faturamento - ultimos 7 dias</h2>
          <div className="h-72 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="vendas" stroke="#4f46e5" strokeWidth={3} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card p-5">
          <h2 className="mb-3 text-lg font-bold">Entradas x saídas</h2>
          <div className="h-72 min-h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="receitas" fill="#10b981" radius={[7, 7, 0, 0]} />
                <Bar dataKey="despesas" fill="#ef4444" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="admin-card grid gap-3 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-zinc-500">Entradas</p>
          <p className="text-lg font-bold text-emerald-600">R$ {metrics.entradas.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Saídas</p>
          <p className="text-lg font-bold text-rose-600">R$ {metrics.saidas.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Lucro do período</p>
          <p className="text-lg font-bold text-indigo-600">R$ {metrics.lucro.toFixed(2)}</p>
        </div>
      </section>
    </div>
  );
}
