"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedEmail === "admin@gmail.com" && normalizedPassword === "ativador") {
      localStorage.setItem("admin_role", "admin");
      router.push("/admin");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase não configurado neste ambiente.");
      setLoading(false);
      return;
    }

    const { error: authError, data } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });
    if (authError || !data.user) {
      setError("Falha no login. Verifique email e senha.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", data.user.id).single();

    router.push(profile?.role === "operator" ? "/admin/pdv" : "/admin");
    setLoading(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-indigo-200/30 lg:grid-cols-2">
        <div className="relative hidden p-10 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500" />
          <div className="relative z-10 flex h-full flex-col justify-between text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-4 w-4" />
              Sistema administrativo premium
            </div>
            <div>
              <h1 className="mb-3 text-4xl font-black leading-tight">Controle total da sua operacao em um painel elegante.</h1>
              <p className="text-white/85">Mais velocidade no dia a dia, melhor organizacao e experiencia profissional.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Acesso administrativo</h2>
              <p className="text-xs text-zinc-500">Entre para gerenciar sua loja</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-600">Email</label>
              <input className="admin-input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-600">Senha</label>
              <input
                type="password"
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
              />
            </div>
            {error ? <p className="rounded-xl bg-rose-50 p-2 text-sm text-rose-600">{error}</p> : null}
            <button className="admin-btn admin-btn-primary w-full" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>
            <p className="rounded-xl bg-zinc-50 p-2 text-xs text-zinc-500">
              Acesso rápido local: admin@gmail.com / ativador
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
