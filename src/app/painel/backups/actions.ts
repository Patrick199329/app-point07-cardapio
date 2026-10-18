"use server";

import { revalidatePath } from "next/cache";

import { requireAdminInnovation } from "@/lib/auth";

export type BackupState = { error: string | null; ok: boolean };

/**
 * Só pede pro GitHub começar a rodar — quem de fato faz o dump e grava o
 * resultado em backup_logs é a rotina em si (scripts/backup-diario.mjs, via
 * service_role). Precisa de GITHUB_PAT (fine-grained, só "Actions: Read and
 * write" neste repositório) e GITHUB_REPO nas variáveis de ambiente da
 * aplicação — ver docs/implantacao-backup-google-drive/08-checklist-e-variaveis-de-ambiente.md.
 */
export async function dispararBackupManual(): Promise<BackupState> {
  await requireAdminInnovation();

  const token = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return { error: "Backup manual ainda não configurado (faltam GITHUB_PAT e GITHUB_REPO).", ok: false };
  }

  const resposta = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/backup-diario.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: process.env.GITHUB_BRANCH || "main" }),
    },
  );

  if (!resposta.ok) {
    const texto = await resposta.text();
    return { error: `Não foi possível disparar o backup agora (${resposta.status}): ${texto}`, ok: false };
  }

  revalidatePath("/painel/backups");
  return { error: null, ok: true };
}
