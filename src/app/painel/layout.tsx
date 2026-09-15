import type { ReactNode } from "react";

import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { carregarLogoSistema } from "@/lib/sistema";

import { PainelShell } from "./painel-shell";

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [{ profile }, logoUrl] = await Promise.all([
    requireRole("admin"),
    carregarLogoSistema(),
  ]);

  return (
    <PainelShell nome={profile.nome} perfil={ROLE_LABEL[profile.role]} logoUrl={logoUrl}>
      {children}
    </PainelShell>
  );
}
