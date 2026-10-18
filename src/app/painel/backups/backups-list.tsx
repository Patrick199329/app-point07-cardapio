"use client";

import { useState, useTransition } from "react";

import { CloudUpload, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
import { BACKUP_STATUS_BADGE, BACKUP_STATUS_LABELS, formatarBytes, type BackupLog } from "@/lib/backup";

import { dispararBackupManual } from "./actions";

function CartaoAutorizacaoGoogle({ diasRestantes }: { diasRestantes: number | null }) {
  const precisaAutorizar = diasRestantes === null || diasRestantes <= 2;

  const mensagem =
    diasRestantes === null
      ? "Ainda não autorizado — o backup não vai conseguir salvar no Drive até isso ser feito."
      : diasRestantes <= 0
        ? "Expirada — reautorize pra voltar a funcionar."
        : `Válida por mais ${diasRestantes} dia(s) (enquanto o app estiver em modo de teste no Google).`;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">Autorização do Google Drive</p>
        <p className="text-sm text-muted-foreground">{mensagem}</p>
      </div>
      <Button variant={precisaAutorizar ? "default" : "outline"} render={<a href="/api/google-oauth/iniciar" />}>
        {diasRestantes === null ? "Autorizar Google Drive" : "Renovar autorização"}
      </Button>
    </div>
  );
}

function BotaoBackupManual() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function disparar() {
    setErro(null);
    startTransition(async () => {
      const result = await dispararBackupManual();
      if (result.ok) {
        toast.success("Backup disparado — acompanhe na lista abaixo em alguns minutos.");
      } else if (result.error) {
        setErro(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        A rotina diária roda sozinha; use o botão abaixo só se precisar de um backup extra agora.
      </p>
      <Button type="button" variant="outline" disabled={pending} onClick={disparar}>
        <CloudUpload className="size-4" />
        {pending ? "Disparando…" : "Rodar backup agora"}
      </Button>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
    </div>
  );
}

export function BackupsList({
  backups,
  diasRestantesGoogle,
  erroQuery,
  autorizadoQuery,
}: {
  backups: BackupLog[];
  diasRestantesGoogle: number | null;
  erroQuery: string | null;
  autorizadoQuery: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CartaoAutorizacaoGoogle diasRestantes={diasRestantesGoogle} />
      <BotaoBackupManual />

      {erroQuery ? <p className="text-sm text-destructive">{erroQuery}</p> : null}
      {autorizadoQuery ? (
        <p className="text-sm text-[#1d8749]">Google Drive autorizado com sucesso.</p>
      ) : null}

      {backups.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum backup registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Arquivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.iniciado_em).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant={BACKUP_STATUS_BADGE[b.status]}>
                      {BACKUP_STATUS_LABELS[b.status]}
                    </Badge>
                    {b.status === "erro" && b.mensagem_erro ? (
                      <p className="mt-1 text-xs text-destructive">{b.mensagem_erro}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatarBytes(b.tamanho_bytes)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.disparado_manualmente ? "Manual" : "Diário"}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.drive_arquivo_url ? (
                      <a
                        href={b.drive_arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                      >
                        <RefreshCw className="size-3" />
                        Abrir no Drive
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
