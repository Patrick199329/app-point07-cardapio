"use client";

import { useMemo, useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  extrairRotuloRegistro,
  rotuloArea,
  TIPO_BADGE,
  TIPO_LABEL,
  type LogAuditoria,
} from "@/lib/auditoria";
import { formatarDataHora } from "@/lib/formato";

type LogComPerfil = LogAuditoria & { profiles: { nome: string } | null };

function BlocoJson({ titulo, dados }: { titulo: string; dados: unknown }) {
  if (dados === null || dados === undefined) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</p>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {JSON.stringify(dados, null, 2)}
      </pre>
    </div>
  );
}

function LinhaLog({ log }: { log: LogComPerfil }) {
  const [aberto, setAberto] = useState(false);
  const temDetalhe = log.antes !== null || log.depois !== null;
  const registro = extrairRotuloRegistro(log.antes, log.depois);

  return (
    <>
      <TableRow
        className={temDetalhe ? "cursor-pointer" : undefined}
        onClick={temDetalhe ? () => setAberto((v) => !v) : undefined}
      >
        <TableCell className="whitespace-nowrap">{formatarDataHora(log.criado_em)}</TableCell>
        <TableCell>{log.profiles?.nome ?? "—"}</TableCell>
        <TableCell>
          <Badge variant={TIPO_BADGE[log.tipo]}>{TIPO_LABEL[log.tipo]}</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{rotuloArea(log.tabela)}</TableCell>
        <TableCell className="text-muted-foreground">{registro}</TableCell>
        <TableCell className="text-right">
          {temDetalhe ? (
            aberto ? (
              <ChevronUp className="ml-auto size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="ml-auto size-4 text-muted-foreground" />
            )
          ) : null}
        </TableCell>
      </TableRow>
      {aberto ? (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <BlocoJson titulo="Antes" dados={log.antes} />
              <BlocoJson titulo="Depois" dados={log.depois} />
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function LogsLista({ logs }: { logs: LogComPerfil[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return logs;
    return logs.filter((log) => {
      const pessoa = log.profiles?.nome?.toLowerCase() ?? "";
      const registro = extrairRotuloRegistro(log.antes, log.depois).toLowerCase();
      return pessoa.includes(termo) || registro.includes(termo);
    });
  }, [logs, busca]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Buscar por pessoa ou registro…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">{filtrados.length} evento(s)</span>
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhum evento encontrado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Quem</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((log) => (
                <LinhaLog key={log.id} log={log} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
