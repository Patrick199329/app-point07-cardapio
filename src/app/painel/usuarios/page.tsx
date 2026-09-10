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
import { ROLE_LABEL } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { definirStatusUsuario } from "./actions";
import { UsuarioDialog } from "./usuario-dialog";

export const metadata = { title: "Usuários — Point07" };

export default async function UsuariosPage() {
  const supabase = await createClient();

  const [{ data: usuarios }, { data: auth }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, email, role, ativo")
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const currentUserId = auth.user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Contas internas com login individual (Administrador e Garçom).
          </p>
        </div>
        <UsuarioDialog trigger={<Button>Novo usuário</Button>} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios && usuarios.length > 0 ? (
              usuarios.map((usuario) => {
                const isSelf = usuario.id === currentUserId;
                return (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.nome}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (você)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {usuario.email ?? "—"}
                    </TableCell>
                    <TableCell>{ROLE_LABEL[usuario.role]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.ativo ? "default" : "secondary"}
                      >
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <UsuarioDialog
                          usuario={usuario}
                          trigger={
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          }
                        />
                        <form action={definirStatusUsuario}>
                          <input
                            type="hidden"
                            name="id"
                            value={usuario.id}
                          />
                          <input
                            type="hidden"
                            name="ativo"
                            value={usuario.ativo ? "false" : "true"}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "Você não pode desativar a própria conta"
                                : undefined
                            }
                          >
                            {usuario.ativo ? "Desativar" : "Ativar"}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
