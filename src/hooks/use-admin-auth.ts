"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

type AuthState = {
  loading: boolean;
  authenticated: boolean;
  role: UserRole | null;
  email: string | null;
};

export function useAdminAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    role: null,
    email: null,
  });

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      const role = (localStorage.getItem("admin_role") as UserRole | null) || null;
      setState({
        loading: false,
        authenticated: Boolean(role),
        role,
        email: role ? "admin@gmail.com" : null,
      });
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const role = (localStorage.getItem("admin_role") as UserRole | null) || null;
      setState({
        loading: false,
        authenticated: Boolean(role),
        role,
        email: role ? "admin@gmail.com" : null,
      });
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();

    setState({
      loading: false,
      authenticated: true,
      role: (profile?.role as UserRole | undefined) || "operator",
      email: data.session.user.email ?? null,
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void refresh();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  return { ...state, refresh };
}
