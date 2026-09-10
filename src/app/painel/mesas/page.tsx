import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

import { definirStatusMesa } from "./actions";
import { MesaDialog } from "./mesa-dialog";

export const metadata = { title: "Mesas — Point07" };

type Mesa = Database["public"]["Tables"]["mesas"]["Row"];

const AREA_LABEL = { interna: "Interna", externa: "Externa" } as const;

function MesaAcoes({ mesa }: { mesa: Mesa }) {
  return (
    <div className="flex gap-2">
      <MesaDialog
        mesa={mesa}
        trigger={
          <Button variant="outline" size="sm">
            Editar
          </Button>
        }
      />
      <form action={definirStatusMesa}>
        <input type="hidden" name="id" value={mesa.id} />
        <input type="hidden" name="ativo" value={mesa.ativo ? "false" : "true"} />
        <Button variant="ghost" size="sm" type="submit">
          {mesa.ativo ? "Desativar" : "Ativar"}
        </Button>
      </form>
    </div>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativa" : "Inativa"}
    </Badge>
  );
}

export default async function MesasPage() {
  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .order("ativo", { ascending: false })
    .order("identificador", { ascending: true });

  const lista = mesas ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de mesas do salão. Base para o QR por mesa (Fase 3).
          </p>
        </div>
        <MesaDialog trigger={<Button>Nova mesa</Button>} />
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhuma mesa cadastrada ainda.
        </p>
      ) : (
        <>
          {/* Mobile — lista de cards */}
          <ul className="space-y-3 md:hidden">
            {lista.map((mesa) => (
              <li key={mesa.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{mesa.identificador}</p>
                    {mesa.apelido ? (
                      <p className="text-sm text-muted-foreground">
                        {mesa.apelido}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge ativo={mesa.ativo} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Área: {AREA_LABEL[mesa.area]}
                </p>
                <div className="mt-3">
                  <MesaAcoes mesa={mesa} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop — tabela */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Apelido</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((mesa) => (
                  <TableRow key={mesa.id}>
                    <TableCell className="font-medium">
                      {mesa.identificador}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mesa.apelido ?? "—"}
                    </TableCell>
                    <TableCell>{AREA_LABEL[mesa.area]}</TableCell>
                    <TableCell>
                      <StatusBadge ativo={mesa.ativo} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <MesaAcoes mesa={mesa} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
