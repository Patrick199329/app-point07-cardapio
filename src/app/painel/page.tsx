import Link from "next/link";

import { BellRing, Table2, UtensilsCrossed, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Visão geral" };

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
      .in("status", ["aceito", "finalizado"])
      .gte("criado_em", desdeHoje),
  ]);

  const cards = [
    {
      titulo: "Atendimentos hoje",
      valor: chamadosHoje.count ?? 0,
      descricao: `${aceitosHoje.count ?? 0} chamado(s) aceito(s)`,
      href: "/painel/eventos?periodo=hoje",
      icon: BellRing,
      cor: "var(--chart-1)",
    },
    {
      titulo: "Cardápio",
      valor: produtosAtivos.count ?? 0,
      descricao: `${categoriasAtivas.count ?? 0} categoria(s) · produtos ativos`,
      href: "/painel/cardapio",
      icon: UtensilsCrossed,
      cor: "var(--chart-2)",
    },
    {
      titulo: "Usuários",
      valor: usuarios.count ?? 0,
      descricao: `${garconsAtivos.count ?? 0} garçom(ns) ativo(s)`,
      href: "/painel/usuarios",
      icon: Users,
      cor: "var(--chart-3)",
    },
    {
      titulo: "Mesas ativas",
      valor: mesasAtivas.count ?? 0,
      descricao: "Disponíveis para o QR por mesa",
      href: "/painel/mesas",
      icon: Table2,
      cor: "var(--chart-4)",
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
        {cards.map((card) => {
          const Icone = card.icon;
          return (
            <Link key={card.titulo} href={card.href} className="block">
              <Card className="shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardDescription>{card.titulo}</CardDescription>
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `color-mix(in oklch, ${card.cor} 15%, white)`, color: card.cor }}
                    >
                      <Icone className="size-4" />
                    </span>
                  </div>
                  <CardTitle className="text-3xl tabular-nums">
                    {card.valor}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.descricao}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
