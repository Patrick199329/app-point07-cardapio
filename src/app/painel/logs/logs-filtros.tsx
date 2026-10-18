"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { AREA_GRUPOS, TIPO_LABEL } from "@/lib/auditoria";

export function LogsFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(chave: string, valor: string) {
    const next = new URLSearchParams(params);
    if (valor === "all") next.delete(chave);
    else next.set(chave, valor);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="f-area">Área</Label>
        <NativeSelect
          id="f-area"
          defaultValue={params.get("area") ?? "all"}
          onChange={(e) => set("area", e.target.value)}
        >
          <option value="all">Todas as áreas</option>
          {AREA_GRUPOS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-tipo">Tipo</Label>
        <NativeSelect
          id="f-tipo"
          defaultValue={params.get("tipo") ?? "all"}
          onChange={(e) => set("tipo", e.target.value)}
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(TIPO_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
