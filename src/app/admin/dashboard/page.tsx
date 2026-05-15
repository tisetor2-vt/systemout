import type { ReactNode } from "react";

const sidebarItems = [
  { name: "Dashboard", icon: "▦", active: true },
  { name: "Products", icon: "🛍️" },
  { name: "Categories", icon: "🗂️" },
  { name: "PDV", icon: "💳" },
  { name: "Finance", icon: "💰" },
  { name: "Customization", icon: "🎛️" },
  { name: "Users", icon: "👥" },
  { name: "Reports", icon: "📈" },
  { name: "Settings", icon: "⚙️" },
];

const summaryCards = [
  { label: "Visitas da loja", value: "0", icon: "📍", color: "bg-violet-100 text-violet-700" },
  { label: "Faturamento", value: "R$ 0,00", icon: "💵", color: "bg-emerald-100 text-emerald-700" },
  { label: "Vendas", value: "0", icon: "🛒", color: "bg-violet-100 text-violet-700" },
  { label: "Clientes online", value: "5", icon: "👥", color: "bg-emerald-100 text-emerald-700" },
];

const revenueBars = [
  { day: "09/05", height: 22 },
  { day: "10/05", height: 42 },
  { day: "11/05", height: 34 },
  { day: "12/05", height: 58 },
  { day: "13/05", height: 46 },
  { day: "14/05", height: 52 },
  { day: "15/05", height: 40 },
];

const bottomNavItems = [
  { label: "Dashboard", icon: "▦", active: true },
  { label: "Produtos", icon: "🛍️" },
  { label: "PDV", icon: "💳" },
  { label: "Mais", icon: "⋯" },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F5F5FA] text-slate-900 antialiased">
      <div className="hidden md:flex">
        <aside className="w-[240px] border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-10">
            <div className="text-2xl font-semibold text-violet-700">RetailPro</div>
            <div className="mt-1 text-sm text-slate-500">Enterprise Admin</div>
          </div>
          <nav className="space-y-2 text-sm text-slate-700">
            {sidebarItems.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  item.active ? "bg-[#EDE9FE] text-violet-700" : "hover:bg-slate-100"
                }`}
              >
                {item.active && <div className="h-10 w-1 rounded-full bg-violet-700" />}
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-1 px-8 py-8">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <input
                  type="search"
                  placeholder="Buscar na plataforma"
                  className="w-full rounded-full border border-slate-200 bg-white py-3 px-5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400"
                />
              </div>
              <div className="hidden md:block text-center text-lg font-semibold text-slate-900">Painel Premium</div>
            </div>
            <div className="flex items-center gap-4">
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                🔔
              </button>
              <div className="h-11 w-11 rounded-full bg-slate-300" />
              <button className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800">
                Logout
              </button>
            </div>
          </header>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="text-2xl font-semibold text-slate-900">Dashboard</div>
              <p className="mt-2 text-sm text-slate-500">Acompanhe os indicadores principais e os movimentos da sua loja.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl ${card.color}`}>
                      {card.icon}
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      <span className="text-sm">🔄</span>
                      Atualização automática
                    </span>
                  </div>
                  <div className="mt-6 text-sm text-slate-500">{card.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[60%_40%]">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Faturamento - últimos 7 dias</div>
                    <div className="mt-1 text-xs text-slate-500">Visão dos últimos movimentos de receita</div>
                  </div>
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50">
                    ⋮
                  </button>
                </div>
                <div className="flex items-end gap-3">
                  {revenueBars.map((bar) => (
                    <div key={bar.day} className="flex-1 self-end">
                      <div className="mx-auto h-40 w-full rounded-full bg-violet-100" style={{ height: `${bar.height}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2 text-[10px] text-slate-500">
                  {revenueBars.map((bar) => (
                    <span key={bar.day} className="text-center">{bar.day}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3 text-sm font-semibold text-slate-900">
                  <span>📊</span>
                  <span>Entradas x saídas</span>
                </div>
                <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 text-emerald-600">● Entradas</span>
                  <span className="inline-flex items-center gap-2 text-red-500">● Saídas</span>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm italic text-slate-500">
                  Sem dados suficientes para o período
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: "Entradas", value: "R$ 0,00", tone: "text-emerald-700", icon: "⬆️" },
                  { title: "Saídas", value: "R$ 0,00", tone: "text-red-600", icon: "⬇️" },
                  { title: "Lucro do período", value: "R$ 0,00", tone: "text-violet-700", icon: "💜" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-4 rounded-3xl bg-slate-50 p-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ${item.tone}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{item.title}</div>
                      <div className={`mt-1 text-xl font-semibold ${item.tone}`}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="mt-8 rounded-3xl bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <span>RetailPro © 2024 RetailPro Systems. All rights reserved.</span>
              <div className="flex flex-wrap items-center gap-4">
                <a href="#" className="hover:text-slate-900">Support</a>
                <a href="#" className="hover:text-slate-900">Privacy Policy</a>
                <a href="#" className="hover:text-slate-900">Terms of Service</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <div className="md:hidden">
        <header className="bg-violet-900 px-5 py-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-3xl bg-white text-center leading-[3rem] text-violet-900 font-semibold">RP</div>
              <div>
                <div className="text-lg font-semibold">Painel Premium</div>
                <div className="text-sm text-violet-200">Gestão da sua loja</div>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-700" />
          </div>
        </header>

        <main className="space-y-4 px-4 py-5">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-slate-500">Dashboard</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">Visão geral rápida</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl ${card.color} flex items-center justify-center text-lg`}>
                      {card.icon}
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">{card.label}</div>
                      <div className="mt-2 text-xl font-semibold text-slate-900">{card.value}</div>
                    </div>
                  </div>
                </div>
                <span className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  🔄 Atualização automática
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>📅 Faturamento - últimos 7 dias</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {revenueBars.map((bar) => (
                  <div key={bar.day} className="mx-auto h-36 w-full rounded-full bg-violet-100" style={{ height: `${bar.height}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] text-slate-500">
                {revenueBars.slice(0, 4).map((bar) => (
                  <span key={bar.day}>{bar.day}</span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>📈 Entradas x saídas</span>
              </div>
              <div className="h-40 rounded-3xl bg-violet-50" />
              <div className="mt-4 grid grid-cols-4 gap-2 text-[10px] text-slate-500">
                {revenueBars.slice(0, 4).map((bar) => (
                  <span key={bar.day}>{bar.day}</span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { title: "Entradas", value: "R$ 0,00", bg: "bg-emerald-50", text: "text-emerald-700", icon: "⬆️" },
                { title: "Saídas", value: "R$ 0,00", bg: "bg-red-50", text: "text-red-600", icon: "⬇️" },
                { title: "Lucro do período", value: "R$ 0,00", bg: "bg-violet-100", text: "text-violet-700", icon: "💜" },
              ].map((item) => (
                <div key={item.title} className={`flex items-center gap-4 rounded-3xl p-4 ${item.bg}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${item.text}`}>{item.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{item.title}</div>
                    <div className={`mt-1 text-lg font-semibold ${item.text}`}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-violet-900 px-4 py-3 shadow-[0_-10px_30px_rgba(91,33,182,0.15)]">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            {bottomNavItems.map((item, index) => (
              <button
                key={index}
                className={`flex flex-col items-center gap-1 rounded-3xl px-3 py-2 text-sm text-white ${
                  item.active ? "bg-violet-800" : "bg-violet-900/90"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
