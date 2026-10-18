import type { Database } from "@/lib/types/database";

// `status` nasce `check (status in (...))` no banco (migration
// 20261018140100_backup_logs.sql) — a versão instalada do Supabase CLI não
// infere união literal de CHECK constraint (mesma situação de
// tamanho_imagem_produto em src/lib/cardapio.ts), só gera `string`. Tipamos
// aqui manualmente e fazemos o cast no ponto de leitura.
export type BackupStatus = "em_andamento" | "sucesso" | "erro";

export type BackupLog = Omit<
  Database["public"]["Tables"]["backup_logs"]["Row"],
  "status"
> & { status: BackupStatus };

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  em_andamento: "Em andamento",
  sucesso: "Sucesso",
  erro: "Erro",
};

export const BACKUP_STATUS_BADGE: Record<BackupStatus, "outline" | "success" | "destructive"> = {
  em_andamento: "outline",
  sucesso: "success",
  erro: "destructive",
};

const VALIDADE_TOKEN_GOOGLE_DIAS = 7;

/**
 * Enquanto o app OAuth do Google ficar em modo "Testing", o refresh token
 * expira ~7 dias depois de emitido (ver docs/implantacao-backup-google-drive/
 * 01-decisoes-de-arquitetura.md, decisão 8).
 */
export function calcularDiasRestantesAutorizacaoGoogle(atualizadoEm: string | null): number | null {
  if (!atualizadoEm) return null;
  const diasDecorridos = Math.floor(
    (Date.now() - new Date(atualizadoEm).getTime()) / (24 * 60 * 60 * 1000),
  );
  return VALIDADE_TOKEN_GOOGLE_DIAS - diasDecorridos;
}

export function formatarBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
