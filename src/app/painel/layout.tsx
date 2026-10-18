import type { ReactNode } from "react";

import { ROLE_LABEL, requireAnyRole } from "@/lib/auth";
import { carregarLogoSistema } from "@/lib/sistema";

import { PainelShell } from "./painel-shell";
import { temAlteracoesPendentes } from "./publicar-actions";

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ profile }, logoUrl, pendente] = await Promise.all([
    requireAnyRole(["admin", "gerente"]),
    carregarLogoSistema(),
    temAlteracoesPendentes(),
  ]);

  return (
    <PainelShell
      nome={profile.nome}
      perfil={ROLE_LABEL[profile.role]}
      logoUrl={logoUrl}
      publicacaoPendente={pendente}
    >
      {children}
    </PainelShell>
  );
}
