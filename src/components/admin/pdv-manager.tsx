"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import { products as fallbackProducts } from "@/lib/mock-data";
import { logEvent } from "@/lib/logger";
import type { CashSession, Product } from "@/lib/types";

type CartItem = Product & { qty: number };

type ReceiptData = {
  saleId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  items: Array<{ name: string; qty: number; unitPrice: number; lineTotal: number }>;
};

export function PdvManager() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState("pix");
  const [splitPayment, setSplitPayment] = useState(false);
  const [amountReceived, setAmountReceived] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<Product | null>(null);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      const [{ data: productsData }, { data: sessionData }] = await Promise.all([
        supabase.from("products").select("*").eq("active", true).order("name"),
        supabase.from("cash_sessions").select("*").is("closed_at", null).order("opened_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (productsData) setProducts(productsData as Product[]);
      if (sessionData) setActiveCashSession(sessionData as CashSession);
      if (!sessionData) setActiveCashSession(null);
    }
    void load();
    const unsubscribeProducts = subscribeTable("products", () => void load());
    const unsubscribeCash = subscribeTable("cash_sessions", () => void load());
    return () => {
      unsubscribeProducts();
      unsubscribeCash();
    };
  }, []);

  useEffect(() => {
    async function openFullscreen() {
      if (typeof document === "undefined" || document.fullscreenElement) return;
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Browser may block if no direct user gesture.
      }
    }
    void openFullscreen();
  }, []);

  const filtered = useMemo(
    () => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0), [cart]);
  const total = Math.max(subtotal - discount, 0);
  const change = paymentMethod === "dinheiro" ? Math.max(amountReceived - total, 0) : 0;
  const remainingForSecondary = paymentMethod === "dinheiro" ? Math.max(total - amountReceived, 0) : 0;

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSelectedPreview(product);
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty } : item)));
  }

  function buildReceiptText(receipt: ReceiptData) {
    const lines = [
      "COMPROVANTE DE VENDA",
      `Pedido: ${receipt.saleId.slice(0, 8)}`,
      `Data: ${new Date(receipt.createdAt).toLocaleString("pt-BR")}`,
      `Cliente: ${receipt.customerName || "Balcao"}`,
      "",
      "ITENS",
      ...receipt.items.map(
        (item) => `${item.qty}x ${item.name} - R$ ${item.lineTotal.toFixed(2)}`,
      ),
      "",
      `Subtotal: R$ ${receipt.subtotal.toFixed(2)}`,
      `Desconto: R$ ${receipt.discount.toFixed(2)}`,
      `Total: R$ ${receipt.total.toFixed(2)}`,
      `Pagamento: ${receipt.paymentMethod.toUpperCase()}`,
      "Obrigado pela preferencia!",
    ];
    return lines.join("\n");
  }

  function printThermalReceipt(receipt: ReceiptData) {
    const printWindow = window.open("", "_blank", "width=420,height=720");
    if (!printWindow) return;

    const itemsHtml = receipt.items
      .map(
        (item) => `
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
            <span>${item.qty}x ${item.name}</span>
            <span>R$ ${item.lineTotal.toFixed(2)}</span>
          </div>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante</title>
          <style>
            body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 8px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #111; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; font-size: 12px; }
            @media print { body { width: 72mm; } }
          </style>
        </head>
        <body>
          <div class="center"><strong>COMPROVANTE DE VENDA</strong></div>
          <div class="center">Pedido ${receipt.saleId.slice(0, 8)}</div>
          <div class="center">${new Date(receipt.createdAt).toLocaleString("pt-BR")}</div>
          <div class="line"></div>
          <div class="row"><span>Cliente:</span><span>${receipt.customerName || "Balcao"}</span></div>
          <div class="row"><span>Telefone:</span><span>${receipt.customerPhone || "-"}</span></div>
          <div class="line"></div>
          ${itemsHtml}
          <div class="line"></div>
          <div class="row"><span>Subtotal</span><strong>R$ ${receipt.subtotal.toFixed(2)}</strong></div>
          <div class="row"><span>Desconto</span><strong>R$ ${receipt.discount.toFixed(2)}</strong></div>
          <div class="row"><span>Total</span><strong>R$ ${receipt.total.toFixed(2)}</strong></div>
          <div class="row"><span>Pagamento</span><strong>${receipt.paymentMethod.toUpperCase()}</strong></div>
          <div class="line"></div>
          <div class="center">Obrigado pela preferencia!</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function sendViaWhatsapp(receipt: ReceiptData) {
    const phone = (receipt.customerPhone || "").replace(/\D/g, "");
    const text = encodeURIComponent(buildReceiptText(receipt));
    const target = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(target, "_blank");
  }

  function sendViaEmail(receipt: ReceiptData) {
    const subject = encodeURIComponent(`Comprovante da venda ${receipt.saleId.slice(0, 8)}`);
    const body = encodeURIComponent(buildReceiptText(receipt));
    const to = customerEmail || "";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  async function finalizeSale() {
    if (!cart.length) {
      toast.error("Adicione itens antes de finalizar.");
      return;
    }
    if (paymentMethod === "dinheiro" && amountReceived < total && !splitPayment) {
      toast.error("Valor em dinheiro menor que total. Ative pagamento misto e escolha a segunda forma.");
      return;
    }
    if (paymentMethod === "dinheiro" && amountReceived < total && splitPayment && secondaryPaymentMethod === "dinheiro") {
      toast.error("Na segunda forma escolha PIX ou Cartão.");
      return;
    }
    if (paymentMethod === "dinheiro" && !activeCashSession) {
      toast.error("Abra o caixa antes de vender em dinheiro.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      toast.info("Configure o Supabase para fechar vendas reais.");
      return;
    }

    const registeredPaymentMethod =
      paymentMethod === "dinheiro" && amountReceived < total && splitPayment
        ? `dinheiro(${amountReceived.toFixed(2)})+${secondaryPaymentMethod}(${remainingForSecondary.toFixed(2)})`
        : paymentMethod;

    const { data: saleResult, error: saleError } = await supabase.rpc("finalize_sale_transaction", {
      p_customer_name: customerName || null,
      p_customer_phone: customerPhone || null,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: registeredPaymentMethod,
      p_items: cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: Number(item.price),
      })),
      p_occurred_on: new Date().toISOString().slice(0, 10),
      p_cash_session_id: paymentMethod === "dinheiro" ? activeCashSession?.id || null : null,
    });
    const sale = Array.isArray(saleResult) ? saleResult[0] : null;
    if (saleError || !sale?.sale_id || !sale?.created_at) {
      logEvent("error", "finalize_sale_transaction_failed", {
        error: saleError?.message,
        paymentMethod,
        total,
      });
      toast.error("Falha ao gerar venda. Verifique estoque e permissões.");
      return;
    }

    const receipt: ReceiptData = {
      saleId: sale.sale_id,
      createdAt: sale.created_at,
      customerName,
      customerPhone,
      paymentMethod: registeredPaymentMethod,
      subtotal,
      discount,
      total,
      items: cart.map((item) => ({
        name: item.name,
        qty: item.qty,
        unitPrice: Number(item.price),
        lineTotal: Number(item.price) * item.qty,
      })),
    };

    setLastReceipt(receipt);
    toast.success("Venda finalizada com sucesso.");
    printThermalReceipt(receipt);
    setCart([]);
    setDiscount(0);
    setAmountReceived(0);
    setSplitPayment(false);
    setCustomerName("");
    setCustomerPhone("");
  }

  async function openCashSession() {
    const supabase = createClient();
    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      toast.error("Sessão inválida.");
      return;
    }
    const { error } = await supabase.from("cash_sessions").insert({
      opened_by: userId,
      opening_amount: openingAmount,
    });
    if (error) {
      logEvent("warn", "cash_session_open_failed", { error: error.message });
      toast.error("Não foi possível abrir o caixa.");
      return;
    }
    toast.success("Caixa aberto com sucesso.");
    setOpeningAmount(0);
  }

  async function closeCashSession() {
    const supabase = createClient();
    if (!supabase || !activeCashSession) return;
    const { error } = await supabase
      .from("cash_sessions")
      .update({
        closing_amount: closingAmount,
        closed_at: new Date().toISOString(),
      })
      .eq("id", activeCashSession.id);
    if (error) {
      logEvent("warn", "cash_session_close_failed", { error: error.message, sessionId: activeCashSession.id });
      toast.error("Não foi possível fechar o caixa.");
      return;
    }
    toast.success("Caixa fechado com sucesso.");
    setClosingAmount(0);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F8") {
        event.preventDefault();
        void document.documentElement.requestFullscreen?.();
      }
      if (event.altKey && event.key === "1") setPaymentMethod("dinheiro");
      if (event.altKey && event.key === "2") setPaymentMethod("pix");
      if (event.altKey && event.key === "3") setPaymentMethod("cartao");
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void finalizeSale();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="space-y-4">
      <div className="admin-card flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">PDV</h1>
          <p className="text-sm text-zinc-500">Painel profissional de vendas com finalização rápida.</p>
        </div>
        <button
          type="button"
          className="admin-btn border"
          onClick={() => void document.documentElement.requestFullscreen?.()}
        >
          Tela cheia
        </button>
      </div>
      <div className="admin-card grid gap-2 p-3 text-xs text-zinc-600 sm:grid-cols-2 lg:grid-cols-5">
        <p><strong>F8</strong> tela cheia</p>
        <p><strong>Alt+1</strong> dinheiro</p>
        <p><strong>Alt+2</strong> PIX</p>
        <p><strong>Alt+3</strong> cartão</p>
        <p><strong>Ctrl/Cmd+Enter</strong> finalizar</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="admin-card space-y-3 p-4">
          <input className="admin-input" placeholder="Buscar produto" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
            {filtered.map((product) => (
              <button key={product.id} className="flex w-full items-center justify-between rounded-xl border border-zinc-200 p-3 text-left transition hover:border-indigo-400" type="button" onClick={() => addToCart(product)}>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-zinc-500">Estoque: {product.stock}</p>
                </div>
                <p className="font-semibold">R$ {Number(product.price).toFixed(2)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-card space-y-3 p-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Controle de caixa</p>
            {activeCashSession ? (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-emerald-600">Caixa aberto desde {new Date(activeCashSession.opened_at).toLocaleTimeString("pt-BR")}</p>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Valor de fechamento"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(Number(e.target.value))}
                />
                <button className="admin-btn border w-full" type="button" onClick={() => void closeCashSession()}>
                  Fechar caixa
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-zinc-500">Caixa fechado. Abra para aceitar vendas em dinheiro.</p>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Valor de abertura"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(Number(e.target.value))}
                />
                <button className="admin-btn border w-full" type="button" onClick={() => void openCashSession()}>
                  Abrir caixa
                </button>
              </div>
            )}
          </div>
          <h2 className="text-lg font-semibold">Resumo da venda</h2>
          {selectedPreview?.image_urls?.[0] ? (
            <div className="relative h-28 w-full overflow-hidden rounded-xl">
              <Image
                src={selectedPreview.image_urls[0]}
                alt={selectedPreview.name}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed text-xs text-zinc-500">
              A imagem do produto aparece aqui durante a venda
            </div>
          )}
          <input className="admin-input" placeholder="Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="admin-input" placeholder="WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          <input className="admin-input" placeholder="E-mail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
          <select className="admin-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="cartao">Cartao</option>
          </select>
          {paymentMethod === "dinheiro" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <input
                className="admin-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor recebido"
                value={amountReceived}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
              />
              <p className="mt-2 text-sm text-emerald-700">
                Troco: <strong>R$ {change.toFixed(2)}</strong>
              </p>
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={splitPayment}
                  onChange={(e) => setSplitPayment(e.target.checked)}
                />
                Complementar com segunda forma
              </label>
              {splitPayment && amountReceived < total ? (
                <div className="mt-2 space-y-1">
                  <select
                    className="admin-input"
                    value={secondaryPaymentMethod}
                    onChange={(e) => setSecondaryPaymentMethod(e.target.value)}
                  >
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                  </select>
                  <p className="text-xs text-emerald-700">
                    Restante para {secondaryPaymentMethod.toUpperCase()}:{" "}
                    <strong>R$ {remainingForSecondary.toFixed(2)}</strong>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2 rounded-xl border p-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <p className="text-sm">{item.name}</p>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded border px-2" onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
                  <span className="text-sm">{item.qty}</span>
                  <button type="button" className="rounded border px-2" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <input className="admin-input" type="number" min="0" step="0.01" placeholder="Desconto" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          <p className="text-sm">Subtotal: <strong>R$ {subtotal.toFixed(2)}</strong></p>
          <p className="text-sm">Total: <strong>R$ {total.toFixed(2)}</strong></p>

          <div className="sticky bottom-3 z-20 rounded-xl bg-white/90 p-2 backdrop-blur">
            <button className="admin-btn admin-btn-primary w-full" type="button" onClick={() => void finalizeSale()}>
              Finalizar venda
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-lg border py-2 text-xs" type="button" onClick={() => lastReceipt && printThermalReceipt(lastReceipt)} disabled={!lastReceipt}>Comprovante</button>
            <button className="rounded-lg border py-2 text-xs" type="button" onClick={() => lastReceipt && sendViaWhatsapp(lastReceipt)} disabled={!lastReceipt}>WhatsApp</button>
            <button className="rounded-lg border py-2 text-xs" type="button" onClick={() => lastReceipt && sendViaEmail(lastReceipt)} disabled={!lastReceipt}>E-mail</button>
          </div>
        </section>
      </div>
    </div>
  );
}
