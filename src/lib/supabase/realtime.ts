import { createClient } from "@/lib/supabase/client";

export function subscribeTable(table: string, onChange: () => void) {
  const supabase = createClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`realtime:${table}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
