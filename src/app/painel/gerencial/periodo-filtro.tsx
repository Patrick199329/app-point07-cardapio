"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

/** Único filtro do painel: período. Escopa todos os indicadores abaixo dele. */
export function PeriodoFiltro() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <div className="max-w-xs space-y-1">
      <Label htmlFor="f-periodo">Período</Label>
      <NativeSelect
        id="f-periodo"
        defaultValue={params.get("periodo") ?? "7d"}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.set("periodo", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        <option value="hoje">Hoje</option>
        <option value="7d">Últimos 7 dias</option>
        <option value="30d">Últimos 30 dias</option>
        <option value="tudo">Tudo</option>
      </NativeSelect>
    </div>
  );
}
