"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/painel", label: "Visão geral", exact: true },
  { href: "/painel/cardapio", label: "Cardápio" },
  { href: "/painel/eventos", label: "Eventos" },
  { href: "/painel/gerencial", label: "Painel gerencial" },
  { href: "/painel/usuarios", label: "Usuários" },
  { href: "/painel/mesas", label: "Mesas" },
  { href: "/painel/configuracoes", label: "Configurações" },
];

export function PainelNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2.5 text-sm transition-colors md:py-2",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
