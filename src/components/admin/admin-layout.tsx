"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Package2, Shapes, BadgeDollarSign, Wallet, Sparkles, Users, ChartColumn, Settings, Menu, X, Store, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const tabs = [
	{ href: "/admin", label: "Dashboard", icon: LayoutGrid, onlyAdmin: true },
	{ href: "/admin/produtos", label: "Produtos", icon: Package2, onlyAdmin: true },
	{ href: "/admin/categorias", label: "Categorias", icon: Shapes, onlyAdmin: true },
	{ href: "/admin/pdv", label: "PDV", icon: BadgeDollarSign, onlyAdmin: false },
	{ href: "/admin/financeiro", label: "Financeiro", icon: Wallet, onlyAdmin: true },
	{ href: "/admin/personalizacao", label: "Personalizacao", icon: Sparkles, onlyAdmin: true },
	{ href: "/admin/usuarios", label: "Usuarios", icon: Users, onlyAdmin: true },
	{ href: "/admin/relatorios", label: "Relatorios", icon: ChartColumn, onlyAdmin: true },
	{ href: "/admin/configuracoes", label: "Configuracoes", icon: Settings, onlyAdmin: true },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const auth = useAdminAuth();
	const [openMobile, setOpenMobile] = useState(false);
	const supabaseReady = Boolean(createClient());

	async function signOut() {
		const supabase = createClient();
		localStorage.removeItem("admin_role");
		if (supabase) {
			await supabase.auth.signOut();
		}
		router.replace("/admin/login");
	}

	useEffect(() => {
		if (pathname === "/admin/login") return;
		if (!auth.loading && !auth.authenticated) {
			router.replace("/admin/login");
			return;
		}
		if (!auth.loading && auth.role === "operator" && pathname !== "/admin/pdv") {
			router.replace("/admin/pdv");
		}
	}, [auth.authenticated, auth.loading, auth.role, pathname, router]);

	const visibleTabs = tabs.filter((tab) => !tab.onlyAdmin || auth.role === "admin");
	const isLoginRoute = pathname === "/admin/login";

	return (
		<div className="min-h-screen bg-[#f6f7fb] text-zinc-900">
			{!isLoginRoute ? (
				<header className="admin-glass sticky top-0 z-40 border-b border-zinc-200/70">
					<div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 md:px-6">
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => setOpenMobile((v) => !v)}
								className="rounded-xl border border-zinc-200 bg-white p-2 md:hidden"
							>
								{openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
							</button>
							<div className="flex items-center gap-2">
								<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
									<Store className="h-4 w-4" />
								</span>
								<div>
									<p className="text-sm font-semibold leading-4">Painel Premium</p>
									<p className="text-xs text-zinc-500">Gestao da sua loja</p>
								</div>
							</div>
						</div>
						<div className="text-right">
							<p className="text-sm font-semibold">{auth.email || "Carregando..."}</p>
							<div className="flex items-center justify-end gap-2">
								<p className="text-xs text-zinc-500">{auth.role === "admin" ? "Administrador" : "Operador"}</p>
								<button
									type="button"
									onClick={() => void signOut()}
									className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
								>
									<LogOut className="mr-1 inline h-3 w-3" />
									Sair
								</button>
							</div>
						</div>
					</div>
				</header>
			) : null}

			<div className="mx-auto flex w-full max-w-[1400px] gap-4 px-4 pb-6 pt-4 md:px-6">
				{!isLoginRoute ? (
					<>
						<aside className="hidden w-72 shrink-0 md:block">
							<div className="admin-card p-3">
								<nav className="space-y-1">
									{visibleTabs.map((tab) => (
										<Link
											key={tab.href}
											href={tab.href}
											className={cn(
												"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
												pathname === tab.href
													? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
													: "text-zinc-600 hover:bg-zinc-100",
											)}
										>
											<tab.icon className="h-4 w-4" />
											{tab.label}
										</Link>
									))}
								</nav>
							</div>
						</aside>

						{openMobile ? (
							<div
								className="fixed inset-0 z-30 bg-black/30 md:hidden"
								onClick={() => setOpenMobile(false)}
							>
								<aside
									className="admin-card m-3 w-72 p-3"
									onClick={(e) => e.stopPropagation()}
								>
									<nav className="space-y-1">
										{visibleTabs.map((tab) => (
											<Link
												key={tab.href}
												href={tab.href}
												onClick={() => setOpenMobile(false)}
												className={cn(
													"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
													pathname === tab.href
														? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
														: "text-zinc-600 hover:bg-zinc-100",
												)}
											>
												<tab.icon className="h-4 w-4" />
												{tab.label}
											</Link>
										))}
									</nav>
								</aside>
							</div>
						) : null}
					</>
				) : null}

				<main className={cn("w-full", !isLoginRoute && "admin-fade-up")}>
					{!isLoginRoute && !supabaseReady ? (
						<div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
							Supabase não está configurado. Defina `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para salvar dados reais.
						</div>
					) : null}
					{children}
				</main>
			</div>
		</div>
	);
}
