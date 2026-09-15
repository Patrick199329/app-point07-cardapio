import Link from "next/link";

import { urlImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

import { SistemaForm } from "./sistema-form";

export const metadata = { title: "Identidade do Sistema — Point07" };

export default async function IdentidadeSistemaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sistema_config")
    .select("logo_path")
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/configuracoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Configurações
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Identidade do sistema</h1>
        <p className="text-sm text-muted-foreground">
          Uma logo só, usada na tela de login, no menu do painel do
          Administrador e no cabeçalho da fila do Garçom — diferente da logo
          do cardápio público (essa fica em Aparência do Cardápio).
        </p>
      </div>

      <SistemaForm logoUrl={urlImagemProduto(data?.logo_path ?? null)} />
    </div>
  );
}
