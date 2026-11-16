"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export type CartaoMesa = {
  id: string;
  identificador: string;
  svg: string;
  /** Texto impresso no cartão, se diferente do identificador (ex.: QR universal). */
  rotuloImpresso?: string;
  /** Começa fora da seleção (não entra num "Selecionar todas" automático). */
  iniciaDesmarcado?: boolean;
};

export function ImpressaoCliente({ cartoes }: { cartoes: CartaoMesa[] }) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(cartoes.filter((c) => !c.iniciaDesmarcado).map((c) => c.id)),
  );

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  const paraImprimir = cartoes.filter((c) => selecionadas.has(c.id));
  // "totem": cada página tem o tamanho exato do totem (100 x 150 mm) — é o que
  // se manda para a gráfica ou se imprime em papel já cortado. "a4": cartões
  // soltos na folha, 4 por folha, para recortar — reduzidos a 95% (95 x 142,5 mm)
  // porque 2 x 150mm = 300mm não cabe nos 297mm da A4 (o cliente aceitou ~0,5 cm
  // a menos nesse formato).
  const [formato, setFormato] = useState<"totem" | "a4">("totem");
  const larguraCartao = formato === "a4" ? "95mm" : "100mm";
  const alturaCartao = formato === "a4" ? "142.5mm" : "150mm";

  return (
    <div className="space-y-6">
      {/* Controles — escondidos na impressão */}
      <div className="print:hidden">
        <fieldset className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <legend className="mb-1 font-medium">Formato</legend>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="formato"
              checked={formato === "totem"}
              onChange={() => setFormato("totem")}
              className="size-4"
            />
            Totem 10 × 15 cm
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="formato"
              checked={formato === "a4"}
              onChange={() => setFormato("a4")}
              className="size-4"
            />
            Folha A4 (4 por folha)
          </label>
          <span className="text-xs text-muted-foreground">Imprimir em escala 100%</span>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSelecionadas(
                new Set(cartoes.filter((c) => !c.iniciaDesmarcado).map((c) => c.id)),
              )
            }
          >
            Selecionar todas as mesas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelecionadas(new Set())}
          >
            Limpar
          </Button>
          <Button
            className="ml-auto"
            onClick={() => window.print()}
            disabled={paraImprimir.length === 0}
          >
            Imprimir {paraImprimir.length > 0 ? `(${paraImprimir.length})` : ""}
          </Button>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {cartoes.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={selecionadas.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="size-4"
                />
                {c.identificador}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Folha de impressão — uma mesa por página, no modelo de arte do cliente */}
      <div className="area-impressao">
        {paraImprimir.map((c) => (
          <article key={c.id} className="cartao-mesa">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mesas/modelo-cartao.png" alt="" className="fundo" />
            <div className="qr-area" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="mesa-label">{c.rotuloImpresso ?? c.identificador}</p>
          </article>
        ))}
      </div>

      <style>{`
        /* Totem físico do cliente: 100 x 150mm (10 x 15cm). A arte é 1276x1713
           (proporção 0,745; o totem é 0,667), então ela é escalada pela ALTURA
           (sem deformar) e centralizada com object-fit: cover — corta ~5,9mm de
           cada lado, só decoração (conferido numa prévia). */
        .cartao-mesa {
          position: relative;
          container-type: inline-size;
          width: ${larguraCartao};
          height: ${alturaCartao};
          break-inside: avoid;
          overflow: hidden;
        }
        .cartao-mesa .fundo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
        }
        /* Coordenadas do quadrado branco medidas por pixel no modelo
           (1276x1713: x 674-1044, y 919-1306), convertidas para a área visível
           depois do corte lateral (x 67-1209, 1142px de largura):
           left = (674-67)/1142, width = 370/1142; top/height não mudam
           (a altura inteira da arte continua visível).
           padding dá uma margininha pro QR não encostar no canto arredondado. */
        .cartao-mesa .qr-area {
          position: absolute;
          left: 53.15%;
          top: 53.65%;
          width: 32.4%;
          height: 22.59%;
          padding: 1.5%;
          box-sizing: border-box;
        }
        .cartao-mesa .qr-area svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .cartao-mesa .mesa-label {
          position: absolute;
          left: 53.15%;
          width: 32.4%;
          top: 78%;
          margin: 0;
          text-align: center;
          color: #f07e22;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 4.2cqw;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .area-impressao {
          display: flex;
          flex-wrap: wrap;
          gap: ${formato === "a4" ? "0" : "4mm"};
        }
        @media screen {
          .area-impressao {
            border: 1px dashed var(--border, #ccc);
            border-radius: 12px;
            padding: 16px;
            background: #fafafa;
          }
        }
        @media print {
          ${
            formato === "totem"
              ? `@page { size: 100mm 150mm; margin: 0; }
          .cartao-mesa { break-after: page; }
          .cartao-mesa:last-child { break-after: auto; }
          .area-impressao { display: block; }`
              : `/* A4 com 4mm de margem = 202 x 289mm úteis: 2 colunas (190mm) x 2 linhas (285mm) = 4 por folha. */
          @page { size: A4 portrait; margin: 4mm; }`
          }
          body * { visibility: hidden !important; }
          .area-impressao, .area-impressao * { visibility: visible !important; }
          .area-impressao {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
