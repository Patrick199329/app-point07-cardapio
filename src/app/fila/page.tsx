import { SignOutButton } from "@/components/sign-out-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { type ChamadoFila, FilaRealtime } from "./fila-realtime";

export const metadata = { title: "Fila — Point07" };
export const dynamic = "force-dynamic";

export default async function FilaPage() {
  const { profile, user } = await requireRole("garcom");
  const supabase = await createClient();

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const [pendentes, mesasRes, meusHoje] = await Promise.all([
    supabase
      .from("chamados")
      .select("id, mesa_id, criado_em")
      .eq("status", "pendente")
      .order("criado_em", { ascending: true }),
    supabase.from("mesas").select("id, identificador"),
    supabase
      .from("chamados")
      .select("*", { count: "exact", head: true })
      .eq("garcom_id", user.id)
      .eq("status", "aceito")
      .gte("aceito_em", inicioHoje.toISOString()),
  ]);

  const mesas: Record<string, string> = {};
  for (const m of mesasRes.data ?? []) mesas[m.id] = m.identificador;

  const inicial: ChamadoFila[] = (pendentes.data ?? []).map((c) => ({
    id: c.id,
    mesaId: c.mesa_id,
    identificador: mesas[c.mesa_id] ?? "Mesa",
    criadoEm: c.criado_em,
  }));

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-lg flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm">
          <span className="font-medium">{profile.nome}</span>
          <span className="ml-2 text-muted-foreground">Garçom</span>
        </div>
        <SignOutButton />
      </header>

      <div className="flex-1 p-4">
        <h1 className="mb-4 text-xl font-semibold">Fila de chamados</h1>
        <FilaRealtime
          inicial={inicial}
          mesas={mesas}
          meusHoje={meusHoje.count ?? 0}
        />
      </div>
    </main>
  );
}
