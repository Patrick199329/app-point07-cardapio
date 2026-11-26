import Link from "next/link";

import { Selo } from "@/components/cardapio/selo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { ExcluirButton } from "../../cardapio/excluir-button";
import { definirStatusSelo, excluirSelo } from "./actions";
import { SeloDialog } from "./selo-dialog";

export const metadata = { title: "Selos dos produtos" };
export const dynamic = "force-dynamic";

export default async function SelosPage() {
  const supabase = await createClient();
  const [{ data: selos }, { data: usos }] = await Promise.all([
    supabase.from("selos").select("id, texto, cor, ativo").order("created_at", { ascending: true }),
    supabase.from("produtos").select("selo_id").not("selo_id", "is", null),
  ]);

  const usoPorSelo = new Map<string, number>();
  for (const p of usos ?? []) {
    if (p.selo_id) usoPorSelo.set(p.selo_id, (usoPorSelo.get(p.selo_id) ?? 0) + 1);
  }
  const lista = selos ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/configuracoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Configurações
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Selos dos produtos</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre os selos aqui (ex.: Indicação da casa, Novidade) e escolha, em cada produto
              do Cardápio, qual usar. Vale depois de clicar em Publicar.
            </p>
          </div>
          <SeloDialog trigger={<Button>Novo selo</Button>} />
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum selo ainda. Crie o primeiro para poder usá-lo nos produtos.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((selo) => {
            const usos = usoPorSelo.get(selo.id) ?? 0;
            return (
              <li key={selo.id} className="flex items-center gap-3 rounded-lg border p-3 sm:p-4">
                <Selo
                  texto={selo.texto}
                  cor={selo.cor}
                  estrelas
                  className={`size-20 shrink-0 -rotate-6 drop-shadow-sm ${selo.ativo ? "" : "opacity-40 grayscale"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{selo.texto}</span>
                    {!selo.ativo ? <Badge variant="secondary">Inativo</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {usos === 0 ? "não usado" : `usado em ${usos} produto(s)`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <SeloDialog
                      selo={selo}
                      trigger={
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      }
                    />
                    <form action={definirStatusSelo}>
                      <input type="hidden" name="id" value={selo.id} />
                      <input type="hidden" name="ativo" value={selo.ativo ? "false" : "true"} />
                      <Button variant="ghost" size="sm" type="submit">
                        {selo.ativo ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <ExcluirButton
                      id={selo.id}
                      acao={excluirSelo}
                      titulo={`Excluir o selo "${selo.texto}"?`}
                      descricao={
                        usos > 0
                          ? `Ele está em ${usos} produto(s), que ficarão sem selo (os produtos não são apagados). Vale no cardápio dos clientes depois de publicar. Não dá para desfazer. Se for só tirar por um tempo, use Desativar.`
                          : "O selo será removido de vez. Não dá para desfazer. Se for só tirar por um tempo, use Desativar."
                      }
                      sucesso="Selo excluído."
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
