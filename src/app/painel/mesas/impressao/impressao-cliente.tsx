"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export type CartaoMesa = {
  id: string;
  identificador: string;
  svg: string;
};

export function ImpressaoCliente({ cartoes }: { cartoes: CartaoMesa[] }) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(cartoes.map((c) => c.id)),
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

  return (
    <div className="space-y-6">
      {/* Controles — escondidos na impressão */}
      <div className="print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSelecionadas(new Set(cartoes.map((c) => c.id)))
            }
          >
            Selecionar todas
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
            <p className="mesa-label">MESA {c.identificador}</p>
          </article>
        ))}
      </div>

      <style>{`
        .cartao-mesa {
          position: relative;
          container-type: inline-size;
          width: 100%;
          max-width: 190mm;
          margin: 0 auto;
          aspect-ratio: 1276 / 1713;
          break-inside: avoid;
          break-after: page;
          overflow: hidden;
        }
        .cartao-mesa:last-child {
          break-after: auto;
        }
        .cartao-mesa .fundo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }
        /* Coordenadas do quadrado branco medidas por pixel no modelo
           (1276x1713: x 674-1044, y 919-1306) — não é um chute visual.
           padding dá uma margininha pro QR não encostar no canto arredondado. */
        .cartao-mesa .qr-area {
          position: absolute;
          left: 52.82%;
          top: 53.65%;
          width: 29%;
          height: 22.59%;
          padding: 6%;
          box-sizing: border-box;
        }
        .cartao-mesa .qr-area svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .cartao-mesa .mesa-label {
          position: absolute;
          left: 52.82%;
          width: 29%;
          top: 78%;
          margin: 0;
          text-align: center;
          color: #f07e22;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 4.2cqw;
          letter-spacing: 0.04em;
        }
        @media screen {
          .area-impressao {
            display: grid;
            gap: 16px;
            border: 1px dashed var(--border, #ccc);
            border-radius: 12px;
            padding: 16px;
            background: #fafafa;
          }
        }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          .area-impressao, .area-impressao * { visibility: visible !important; }
          .area-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .cartao-mesa {
            max-width: none;
            width: 210mm;
            height: 297mm;
            aspect-ratio: auto;
          }
          .cartao-mesa .fundo { object-fit: contain; }
        }
      `}</style>
    </div>
  );
}
