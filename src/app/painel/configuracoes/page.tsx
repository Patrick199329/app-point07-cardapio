import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Configurações — Point07" };

const SECOES = [
  {
    titulo: "Aparência do Cardápio",
    descricao:
      "Cores, sombra, arredondamento, logo e cabeçalho do cardápio público (/cardapio).",
    href: "/painel/configuracoes/cardapio",
  },
  {
    titulo: "Identidade do Sistema",
    descricao:
      "Logo da tela de login, do menu do painel e do cabeçalho da fila do garçom.",
    href: "/painel/configuracoes/sistema",
  },
  {
    titulo: "Fila do Garçom",
    descricao:
      "Tempo limite antes de um chamado pendente ser destacado na tela do garçom.",
    href: "/painel/configuracoes/fila",
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Aparência e identidade visual da plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECOES.map((secao) => (
          <Link key={secao.href} href={secao.href} className="block">
            <Card className="transition-colors hover:border-foreground/20">
              <CardHeader>
                <CardTitle className="text-base">{secao.titulo}</CardTitle>
                <CardDescription>{secao.descricao}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
