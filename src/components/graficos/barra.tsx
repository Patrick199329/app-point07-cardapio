/**
 * Barra horizontal — comparação de magnitude entre categorias (garçom, mesa).
 * Um hue só (`--viz-serie`, azul validado — ver docs/dataviz), rótulo direto
 * no fim da barra em vez de tooltip de hover (poucos itens por gráfico neste
 * painel; ver plano do Módulo 5).
 */
export function Barra({
  rotulo,
  valor,
  maximo,
  exibirValor,
}: {
  rotulo: string;
  valor: number;
  maximo: number;
  /** Texto mostrado ao final da barra. Default: o próprio `valor`. */
  exibirValor?: string;
}) {
  const pct = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0;
  const largura = valor > 0 ? Math.max(pct, 3) : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-24 shrink-0 truncate text-sm sm:w-32"
        title={rotulo}
      >
        {rotulo}
      </span>
      <div className="h-6 min-w-0 flex-1 rounded-[4px] bg-muted">
        <div
          className="h-6 rounded-r-[4px] bg-[var(--viz-serie)]"
          style={{ width: `${largura}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums">
        {exibirValor ?? valor}
      </span>
    </div>
  );
}
