import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Visão geral — Point07" };

export default async function PainelHome() {
  const supabase = await createClient();

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const desdeHoje = inicioHoje.toISOString();

  const [
    usuarios,
    garconsAtivos,
    mesasAtivas,
    categoriasAtivas,
    produtosAtivos,
    chamadosHoje,
    aceitosHoje,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "garcom")
      .eq("ativo", true),
    supabase
      .from("mesas")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true),
    supabase
      .from("categorias")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true),
    supabase
      .from("produtos")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true),
    supabase
      .from("chamados")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", desdeHoje),
    supabase
      .from("chamados")
      .select("*", { count: "exact", head: true })
      .eq("status", "aceito")
      .gte("criado_em", desdeHoje),
  ]);

  const cards = [
    {
      titulo: "Atendimentos hoje",
      valor: chamadosHoje.count ?? 0,
      descricao: `${aceitosHoje.count ?? 0} chamado(s) aceito(s)`,
      href: "/painel/eventos?periodo=hoje",
    },
    {
      titulo: "Cardápio",
      valor: produtosAtivos.count ?? 0,
      descricao: `${categoriasAtivas.count ?? 0} categoria(s) · produtos ativos`,
      href: "/painel/cardapio",
    },
    {
      titulo: "Usuários",
      valor: usuarios.count ?? 0,
      descricao: `${garconsAtivos.count ?? 0} garçom(ns) ativo(s)`,
      href: "/painel/usuarios",
    },
    {
      titulo: "Mesas ativas",
      valor: mesasAtivas.count ?? 0,
      descricao: "Disponíveis para o QR por mesa",
      href: "/painel/mesas",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Cardápio, atendimento de salão, usuários e mesas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.titulo} href={card.href} className="block">
            <Card className="transition-colors hover:border-foreground/20">
              <CardHeader className="pb-2">
                <CardDescription>{card.titulo}</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {card.valor}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
