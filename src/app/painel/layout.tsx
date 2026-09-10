import type { ReactNode } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { ROLE_LABEL, requireRole } from "@/lib/auth";

import { PainelNav } from "./painel-nav";

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireRole("admin");

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="shrink-0 border-b p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4 px-3 text-base font-semibold">Point07</div>
        <PainelNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm">
            <span className="font-medium">{profile.nome}</span>
            <span className="ml-2 text-muted-foreground">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
