/**
 * Tendência por dia — colunas verticais, uma por dia, dentro de um carrossel
 * horizontal (evita espremer 30 dias numa tela de celular). Mesmo hue único
 * das barras horizontais (`--viz-serie`), valor no topo de cada coluna.
 */
export function ColunasDia({
  pontos,
}: {
  pontos: { dia: string; rotulo: string; valor: number }[];
}) {
  const maximo = Math.max(1, ...pontos.map((p) => p.valor));

  return (
    <div className="overflow-x-auto">
      <div className="flex h-40 min-w-max items-end gap-2 px-1 pt-6">
        {pontos.map((p) => {
          const alturaPct = p.valor > 0 ? Math.max((p.valor / maximo) * 100, 6) : 0;
          return (
            <div
              key={p.dia}
              className="flex h-full w-9 shrink-0 flex-col items-center justify-end gap-1"
            >
              <span className="text-xs font-medium tabular-nums text-foreground">
                {p.valor > 0 ? p.valor : ""}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-[var(--viz-serie)]"
                  style={{ height: `${alturaPct}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">{p.rotulo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
