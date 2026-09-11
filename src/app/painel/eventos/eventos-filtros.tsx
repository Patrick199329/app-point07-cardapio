"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

export function EventosFiltros({
  garcons,
  mesas,
}: {
  garcons: { id: string; nome: string }[];
  mesas: { id: string; identificador: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(chave: string, valor: string) {
    const next = new URLSearchParams(params);
    if (valor === "" || valor === "all") next.delete(chave);
    else next.set(chave, valor);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="f-periodo">Período</Label>
        <NativeSelect
          id="f-periodo"
          defaultValue={params.get("periodo") ?? "7d"}
          onChange={(e) => set("periodo", e.target.value)}
        >
          <option value="hoje">Hoje</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="tudo">Tudo</option>
        </NativeSelect>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-status">Status</Label>
        <NativeSelect
          id="f-status"
          defaultValue={params.get("status") ?? "all"}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="aceito">Aceito</option>
          <option value="cancelado">Cancelado</option>
        </NativeSelect>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-garcom">Garçom</Label>
        <NativeSelect
          id="f-garcom"
          defaultValue={params.get("garcom") ?? "all"}
          onChange={(e) => set("garcom", e.target.value)}
        >
          <option value="all">Todos</option>
          {garcons.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1">
        <Label htmlFor="f-mesa">Mesa</Label>
        <NativeSelect
          id="f-mesa"
          defaultValue={params.get("mesa") ?? "all"}
          onChange={(e) => set("mesa", e.target.value)}
        >
          <option value="all">Todas</option>
          {mesas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.identificador}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
