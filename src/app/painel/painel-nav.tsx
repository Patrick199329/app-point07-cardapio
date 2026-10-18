"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BellRing,
  CalendarDays,
  LayoutGrid,
  Settings,
  Table2,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/painel", label: "Visão geral", exact: true, icon: LayoutGrid },
  { href: "/fila", label: "Fila", icon: BellRing },
  { href: "/painel/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/painel/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/painel/gerencial", label: "Painel gerencial", icon: LayoutGrid },
  { href: "/painel/usuarios", label: "Usuários", icon: Users },
  { href: "/painel/mesas", label: "Mesas", icon: Table2 },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

export function PainelNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icone = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors md:py-2",
              active
                ? "bg-primary font-medium text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icone className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
