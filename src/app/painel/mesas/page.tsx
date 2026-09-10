import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

import { definirStatusMesa } from "./actions";
import { MesaDialog } from "./mesa-dialog";

export const metadata = { title: "Mesas — Point07" };

const AREA_LABEL = { interna: "Interna", externa: "Externa" } as const;

export default async function MesasPage() {
  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .order("ativo", { ascending: false })
    .order("identificador", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de mesas do salão. Base para o QR por mesa (Fase 2).
          </p>
        </div>
        <MesaDialog trigger={<Button>Nova mesa</Button>} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
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
            {mesas && mesas.length > 0 ? (
              mesas.map((mesa) => (
                <TableRow key={mesa.id}>
                  <TableCell className="font-medium">
                    {mesa.identificador}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mesa.apelido ?? "—"}
                  </TableCell>
                  <TableCell>{AREA_LABEL[mesa.area]}</TableCell>
                  <TableCell>
                    <Badge variant={mesa.ativo ? "default" : "secondary"}>
                      {mesa.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
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
                        <input
                          type="hidden"
                          name="ativo"
                          value={mesa.ativo ? "false" : "true"}
                        />
                        <Button variant="ghost" size="sm" type="submit">
                          {mesa.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhuma mesa cadastrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
