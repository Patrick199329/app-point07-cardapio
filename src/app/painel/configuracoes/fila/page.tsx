import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { FilaConfigForm } from "./fila-config-form";

export const metadata = { title: "Fila do Garçom — Point07" };

export default async function ConfiguracoesFilaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fila_config")
    .select("alerta_atraso_segundos")
    .eq("id", 1)
    .single();

  const totalSegundos = data?.alerta_atraso_segundos ?? 300;
  const minutosIniciais = Math.floor(totalSegundos / 60);
  const segundosIniciais = totalSegundos % 60;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/configuracoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Configurações
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Fila do garçom</h1>
        <p className="text-sm text-muted-foreground">
          Tempo limite antes de um chamado pendente ser destacado na tela do
          garçom (Módulo 3).
        </p>
      </div>

      <FilaConfigForm
        minutosIniciais={minutosIniciais}
        segundosIniciais={segundosIniciais}
      />
    </div>
  );
}
