"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/painel", label: "Visão geral", exact: true },
  { href: "/painel/usuarios", label: "Usuários" },
  { href: "/painel/mesas", label: "Mesas" },
];

const EM_BREVE = ["Cardápio", "Painel gerencial", "Eventos"];

export function PainelNav() {
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
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <span className="mt-5 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
        Próximas fases
      </span>
      {EM_BREVE.map((label) => (
        <span
          key={label}
          className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-muted-foreground/40"
        >
          {label}
        </span>
      ))}
    </nav>
  );
}
