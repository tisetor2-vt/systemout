"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { subscribeTable } from "@/lib/supabase/realtime";
import type { UserRole } from "@/lib/types";

type UserProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export function UsersManager() {
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("operator");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Não foi possível carregar usuários.");
      return;
    }
    setUsers((data || []) as UserProfileRow[]);
  }, []);

  useEffect(() => {
    void load();
    const unsub = subscribeTable("user_profiles", () => void load());
    return () => unsub();
  }, [load]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      toast.error("Supabase não configurado.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("create_operator_user", {
      p_email: email.trim().toLowerCase(),
      p_password: password.trim(),
      p_full_name: fullName.trim(),
      p_role: role,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Falha ao criar usuário.");
      return;
    }
    toast.success("Usuário criado com sucesso.");
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("operator");
    await load();
  }

  async function updateRole(userId: string, nextRole: UserRole) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase.from("user_profiles").update({ role: nextRole }).eq("id", userId);
    if (error) {
      toast.error("Não foi possível atualizar o papel.");
      return;
    }
    toast.success("Permissão atualizada.");
    await load();
  }

  return (
    <div className="space-y-4">
      <section className="admin-card p-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Usuários e Permissões</h1>
        <p className="text-sm text-zinc-500">Crie usuários com acesso exclusivo ao PDV ou acesso total de administração.</p>
      </section>

      <form onSubmit={onSubmit} className="admin-card grid gap-3 p-4 md:grid-cols-4">
        <input className="admin-input" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="admin-input" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="admin-input" placeholder="Senha inicial" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="admin-input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="operator">Operador (somente PDV)</option>
          <option value="admin">Administrador (acesso total)</option>
        </select>
        <div className="sticky bottom-3 z-20 bg-white/90 p-2 backdrop-blur md:col-span-4">
          <button className="admin-btn admin-btn-primary w-full" disabled={loading} type="submit">
            <UserPlus className="mr-1 inline h-4 w-4" />
            {loading ? "Criando usuário..." : "Criar usuário"}
          </button>
        </div>
      </form>

      <section className="admin-card overflow-hidden">
        <div className="border-b bg-zinc-50 px-4 py-3 text-sm font-semibold">Usuários cadastrados</div>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{user.full_name || "Sem nome"}</p>
                <p className="text-xs text-zinc-500">{user.id.slice(0, 8)}...</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={user.role}
                  onChange={(e) => void updateRole(user.id, e.target.value as UserRole)}
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
