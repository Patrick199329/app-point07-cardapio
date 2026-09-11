import type { Metadata } from "next";

import { CardapioPublico } from "@/components/cardapio/cardapio-publico";
import { carregarCardapioPublico } from "@/lib/cardapio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio — Point07",
  description: "Cardápio do Point07",
};

export default async function CardapioPublicoPage() {
  const data = await carregarCardapioPublico();
  return <CardapioPublico {...data} mesaToken={null} />;
}
