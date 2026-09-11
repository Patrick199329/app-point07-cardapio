import type { Metadata } from "next";

import { CardapioPublico } from "@/components/cardapio/cardapio-publico";
import { carregarCardapioPublico } from "@/lib/cardapio";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio — Point07",
  description: "Cardápio do Point07",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MesaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let mesaIdentificador: string | undefined;
  let mesaTokenValido: string | null = null;

  if (UUID_RE.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("mesa_por_token", { p_token: token });
    const mesa = data?.[0];
    if (mesa) {
      mesaIdentificador = mesa.identificador;
      mesaTokenValido = token;
    }
  }

  const cardapio = await carregarCardapioPublico();

  return (
    <CardapioPublico
      {...cardapio}
      mesaToken={mesaTokenValido}
      mesaIdentificador={mesaIdentificador}
    />
  );
}
