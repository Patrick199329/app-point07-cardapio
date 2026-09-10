import type { ReactNode } from "react";

import { ROLE_LABEL, requireRole } from "@/lib/auth";

import { PainelShell } from "./painel-shell";

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireRole("admin");

  return (
    <PainelShell nome={profile.nome} perfil={ROLE_LABEL[profile.role]}>
      {children}
    </PainelShell>
  );
}
