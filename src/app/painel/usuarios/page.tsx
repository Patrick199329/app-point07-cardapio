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

type Usuario = {
  id: string;
  nome: string;
  email: string | null;
  role: "admin" | "garcom";
  ativo: boolean;
};

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "default" : "secondary"}>
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function UsuarioAcoes({ usuario, isSelf }: { usuario: Usuario; isSelf: boolean }) {
  return (
    <div className="flex gap-2">
      <UsuarioDialog
        usuario={usuario}
        trigger={
          <Button variant="outline" size="sm">
            Editar
          </Button>
        }
      />
      <form action={definirStatusUsuario}>
        <input type="hidden" name="id" value={usuario.id} />
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
          title={isSelf ? "Você não pode desativar a própria conta" : undefined}
        >
          {usuario.ativo ? "Desativar" : "Ativar"}
        </Button>
      </form>
    </div>
  );
}

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

  const lista = usuarios ?? [];
  const currentUserId = auth.user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Contas internas com login individual (Administrador e Garçom).
          </p>
        </div>
        <UsuarioDialog trigger={<Button>Novo usuário</Button>} />
      </div>

      {lista.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum usuário cadastrado.
        </p>
      ) : (
        <>
          {/* Mobile — lista de cards */}
          <ul className="space-y-3 md:hidden">
            {lista.map((usuario) => {
              const isSelf = usuario.id === currentUserId;
              return (
                <li key={usuario.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {usuario.nome}
                        {isSelf ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (você)
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {usuario.email ?? "—"}
                      </p>
                    </div>
                    <StatusBadge ativo={usuario.ativo} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Perfil: {ROLE_LABEL[usuario.role]}
                  </p>
                  <div className="mt-3">
                    <UsuarioAcoes usuario={usuario} isSelf={isSelf} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop — tabela */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
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
                {lista.map((usuario) => {
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
                        <StatusBadge ativo={usuario.ativo} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <UsuarioAcoes usuario={usuario} isSelf={isSelf} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
