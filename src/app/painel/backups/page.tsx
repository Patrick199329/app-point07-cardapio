import { requireAdminInnovation } from "@/lib/auth";
import { calcularDiasRestantesAutorizacaoGoogle, type BackupLog } from "@/lib/backup";
import { createClient } from "@/lib/supabase/server";

import { BackupsList } from "./backups-list";

export const metadata = { title: "Backups" };
export const dynamic = "force-dynamic";

/**
 * Terceiro nível de admin (Innovation) — ver requireAdminInnovation() em
 * src/lib/auth.ts. Não aparece pro admin/gerente do cliente final, mesmo
 * entrando pela URL direta. Ver docs/implantacao-backup-google-drive/.
 */
export default async function BackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; autorizado?: string }>;
}) {
  await requireAdminInnovation();

  const { erro, autorizado } = await searchParams;
  const supabase = await createClient();

  const [{ data: backups }, { data: integracaoGoogle }] = await Promise.all([
    supabase
      .from("backup_logs")
      .select("*")
      .order("iniciado_em", { ascending: false })
      .limit(60),
    supabase.from("integracao_google_drive").select("atualizado_em").eq("id", true).single(),
  ]);

  const diasRestantesGoogle = calcularDiasRestantesAutorizacaoGoogle(
    integracaoGoogle?.atualizado_em ?? null,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Backups</h1>
        <p className="text-sm text-muted-foreground">
          Backup diário do banco, usuários e arquivos pro Google Drive — visível só pra quem
          desenvolve a plataforma.
        </p>
      </div>
      <BackupsList
        backups={(backups ?? []) as BackupLog[]}
        diasRestantesGoogle={diasRestantesGoogle}
        erroQuery={erro ?? null}
        autorizadoQuery={autorizado === "1"}
      />
    </div>
  );
}
