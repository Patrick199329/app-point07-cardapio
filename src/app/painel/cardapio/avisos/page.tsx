import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { definirStatusAviso } from "../actions";
import { ReorderButtons } from "../reorder-buttons";
import { AvisoDialog } from "./aviso-dialog";

export const metadata = { title: "Avisos — Cardápio — Point07" };

export default async function AvisosPage() {
  const supabase = await createClient();
  const { data: avisos } = await supabase
    .from("avisos")
    .select("id, texto, ativo, ordem")
    .order("ordem", { ascending: true });

  const lista = avisos ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/cardapio"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Cardápio
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Avisos</h1>
            <p className="text-sm text-muted-foreground">
              Blocos de texto exibidos no rodapé do cardápio público.
            </p>
          </div>
          <AvisoDialog trigger={<Button>Novo aviso</Button>} />
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum aviso cadastrado.
        </p>
      ) : (
        <ul className="space-y-3">
          {lista.map((aviso, i) => (
            <li
              key={aviso.id}
              className="flex gap-2 rounded-lg border p-3 sm:p-4"
            >
              <ReorderButtons
                tabela="avisos"
                id={aviso.id}
                primeiro={i === 0}
                ultimo={i === lista.length - 1}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 text-sm">{aviso.texto}</p>
                  {!aviso.ativo ? (
                    <Badge variant="secondary">Inativo</Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-2">
                  <AvisoDialog
                    aviso={aviso}
                    trigger={
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    }
                  />
                  <form action={definirStatusAviso}>
                    <input type="hidden" name="id" value={aviso.id} />
                    <input
                      type="hidden"
                      name="ativo"
                      value={aviso.ativo ? "false" : "true"}
                    />
                    <Button variant="ghost" size="sm" type="submit">
                      {aviso.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
