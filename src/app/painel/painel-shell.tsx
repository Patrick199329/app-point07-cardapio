"use client";

import { type ReactNode, useState } from "react";

import { Copy, ExternalLink, Menu } from "lucide-react";
import { toast } from "sonner";

import { SignOutButton } from "@/components/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PainelNav } from "./painel-nav";
import { PublicarButton } from "./publicar-button";

function Marca({ logoUrl, className }: { logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="Point07" className={`w-auto object-contain ${className ?? "h-7"}`} />;
  }
  return <span className="text-base font-semibold">Point07</span>;
}

/**
 * Abre o cardápio público (o que o cliente vê, já publicado) numa nova aba —
 * pra conferir o resultado sem sair do painel. No celular só o ícone.
 */
function VerCardapioLink() {
  return (
    <a
      href="/cardapio"
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({ variant: "outline", size: "sm" })}
      title="Abrir o cardápio público em uma nova aba"
    >
      <ExternalLink className="size-4" />
      <span className="max-sm:sr-only">Ver cardápio</span>
    </a>
  );
}

/**
 * Copia o link público do cardápio (o mesmo que "Ver cardápio" abre) pra colar
 * em redes sociais/WhatsApp. É o link SEM QR de mesa: quem entra por ele vê o
 * cardápio mas não consegue chamar o garçom.
 */
function CopiarLinkCardapio() {
  async function copiar() {
    const link = `${window.location.origin}/cardapio`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link do cardápio copiado.", { description: link });
    } catch {
      // Sem permissão de área de transferência: mostra o link pra copiar na mão.
      toast.message("Copie o link do cardápio:", { description: link, duration: 15000 });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copiar}
      title="Copiar o link do cardápio para divulgar (redes sociais, WhatsApp)"
    >
      <Copy className="size-4" />
      <span className="max-sm:sr-only">Copiar link</span>
    </Button>
  );
}

function AvatarIniciais({ nome }: { nome: string }) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {inicial}
    </span>
  );
}

export function PainelShell({
  nome,
  perfil,
  logoUrl,
  publicacaoPendente,
  mostrarInnovation,
  children,
}: {
  nome: string;
  perfil: string;
  logoUrl: string | null;
  publicacaoPendente: boolean;
  mostrarInnovation: boolean;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-background md:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden shrink-0 bg-sidebar p-4 md:block md:w-64 md:border-r md:border-sidebar-border">
        <div className="mb-6 px-3 pt-1">
          <Marca logoUrl={logoUrl} className="h-8" />
        </div>
        <PainelNav mostrarInnovation={mostrarInnovation} />
      </aside>

      {/* Barra superior — mobile */}
      <header className="flex items-center gap-2 border-b bg-sidebar px-2 py-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <Marca logoUrl={logoUrl} className="h-7" />
        <div className="ml-auto flex items-center gap-2">
          <VerCardapioLink />
          <CopiarLinkCardapio />
          <PublicarButton pendente={publicacaoPendente} />
          <SignOutButton />
        </div>
      </header>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center">
              <Marca logoUrl={logoUrl} className="h-7" />
            </SheetTitle>
            <SheetDescription>
              {nome} · {perfil}
            </SheetDescription>
          </SheetHeader>
          <div className="p-3">
            <PainelNav onNavigate={() => setNavOpen(false)} mostrarInnovation={mostrarInnovation} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-between border-b bg-card px-6 py-3 md:flex">
          <div className="flex items-center gap-3">
            <AvatarIniciais nome={nome} />
            <div className="text-sm">
              <p className="font-medium">{nome}</p>
              <p className="text-muted-foreground">{perfil}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VerCardapioLink />
          <CopiarLinkCardapio />
            <PublicarButton pendente={publicacaoPendente} />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
