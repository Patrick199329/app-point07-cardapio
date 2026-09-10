"use client";

import { type ReactNode, useState } from "react";

import { Menu } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PainelNav } from "./painel-nav";

export function PainelShell({
  nome,
  perfil,
  children,
}: {
  nome: string;
  perfil: string;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden shrink-0 border-r p-4 md:block md:w-60">
        <div className="mb-4 px-3 text-base font-semibold">Point07</div>
        <PainelNav />
      </aside>

      {/* Barra superior — mobile */}
      <header className="flex items-center gap-1 border-b px-2 py-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <span className="font-semibold">Point07</span>
        <div className="ml-auto">
          <SignOutButton />
        </div>
      </header>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Point07</SheetTitle>
            <SheetDescription>
              {nome} · {perfil}
            </SheetDescription>
          </SheetHeader>
          <div className="p-3">
            <PainelNav onNavigate={() => setNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-between border-b px-6 py-3 md:flex">
          <div className="text-sm">
            <span className="font-medium">{nome}</span>
            <span className="ml-2 text-muted-foreground">{perfil}</span>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
