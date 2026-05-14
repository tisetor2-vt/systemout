"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { FinanceEntry, Sale } from "@/lib/types";

export function ReportsManager() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      let salesQuery = supabase.from("sales").select("*").order("created_at", { ascending: false });
      let financeQuery = supabase.from("financial_entries").select("*").order("occurred_on", { ascending: false });
      if (from) {
        salesQuery = salesQuery.gte("created_at", `${from}T00:00:00`);
        financeQuery = financeQuery.gte("occurred_on", from);
      }
      if (to) {
        salesQuery = salesQuery.lte("created_at", `${to}T23:59:59`);
        financeQuery = financeQuery.lte("occurred_on", to);
      }
      const [{ data: salesData }, { data: entriesData }] = await Promise.all([salesQuery, financeQuery]);
      if (salesData) setSales(salesData as Sale[]);
      if (entriesData) setEntries(entriesData as FinanceEntry[]);
    }
    void load();
    const unsubSales = subscribeTable("sales", () => void load());
    const unsubFinance = subscribeTable("financial_entries", () => void load());
    return () => {
      unsubSales();
      unsubFinance();
    };
  }, [from, to]);

  const totals = useMemo(() => {
    const vendas = sales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const entradas = entries.filter((e) => e.type === "entrada").reduce((acc, e) => acc + Number(e.amount), 0);
    const saidas = entries.filter((e) => e.type === "saida").reduce((acc, e) => acc + Number(e.amount), 0);
    return { vendas, entradas, saidas, lucro: entradas - saidas, pedidos: sales.length };
  }, [entries, sales]);

  function exportCsv() {
    const rows = [
      ["metric", "value"],
      ["vendas", totals.vendas.toFixed(2)],
      ["entradas", totals.entradas.toFixed(2)],
      ["saidas", totals.saidas.toFixed(2)],
      ["lucro", totals.lucro.toFixed(2)],
      ["pedidos", String(totals.pedidos)],
    ];
    const csv = rows.map((line) => line.join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-wrap items-center justify-between gap-2 p-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Relatórios</h1>
          <p className="text-sm text-zinc-500">Análise premium da operação com filtros de período e exportação.</p>
        </div>
        <div className="flex gap-2">
          <button className="admin-btn border" onClick={() => window.print()} type="button">Imprimir relatório</button>
          <button className="admin-btn border" onClick={exportCsv} type="button">Exportar CSV</button>
        </div>
      </div>

      <section className="admin-card flex flex-wrap items-end gap-2 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">De</label>
          <input className="admin-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-zinc-500">Até</label>
          <input className="admin-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="admin-btn border" type="button" onClick={() => { setFrom(""); setTo(""); }}>
          Limpar filtro
        </button>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="admin-card p-4"><p className="text-xs text-zinc-500">Faturamento</p><strong>R$ {totals.vendas.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-xs text-zinc-500">Entradas</p><strong className="text-emerald-600">R$ {totals.entradas.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-xs text-zinc-500">Saídas</p><strong className="text-rose-600">R$ {totals.saidas.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-xs text-zinc-500">Lucro</p><strong className="text-indigo-600">R$ {totals.lucro.toFixed(2)}</strong></article>
        <article className="admin-card p-4"><p className="text-xs text-zinc-500">Pedidos</p><strong>{totals.pedidos}</strong></article>
      </div>

      <section className="admin-card p-4">
        <h2 className="mb-3 text-lg font-semibold">Ultimas vendas</h2>
        <div className="space-y-2">
          {sales.slice(0, 20).map((sale) => (
            <div key={sale.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Pedido {sale.id.slice(0, 8)}</p>
                <p className="text-xs text-zinc-500">{sale.customer_name || "Cliente balcao"} - {sale.created_at?.slice(0, 10)}</p>
              </div>
              <p className="font-semibold">R$ {Number(sale.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
