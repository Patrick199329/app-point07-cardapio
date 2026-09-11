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

      {/* Folha de impressão */}
      <div className="area-impressao">
        <div className="cartoes">
          {paraImprimir.map((c) => (
            <article key={c.id} className="cartao">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/logo-point07-branca.png"
                alt="Point07"
                className="logo"
              />
              <p className="mesa">MESA {c.identificador}</p>
              <div
                className="qr"
                dangerouslySetInnerHTML={{ __html: c.svg }}
              />
              <p className="chamada">
                Aponte a câmera para ver o cardápio e chamar o garçom
              </p>
              <p className="tag">O Point certo para viver bons momentos!</p>
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .cartoes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8mm;
        }
        .cartao {
          break-inside: avoid;
          background: #0c0c0c;
          color: #fff;
          border-radius: 14px;
          padding: 10mm 8mm;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5mm;
        }
        .cartao .logo {
          width: 46mm;
          height: auto;
        }
        .cartao .mesa {
          font-size: 20pt;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #f07e22;
          margin: 0;
        }
        .cartao .qr {
          background: #fff;
          border-radius: 10px;
          padding: 5mm;
          width: 46mm;
          height: 46mm;
        }
        .cartao .qr svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .cartao .chamada {
          font-size: 8.5pt;
          line-height: 1.35;
          color: #e9e9e9;
          margin: 0;
          max-width: 55mm;
        }
        .cartao .tag {
          font-size: 8pt;
          color: #f07e22;
          margin: 0;
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
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          .area-impressao, .area-impressao * { visibility: visible !important; }
          .area-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            border: 0;
            background: #fff;
          }
          .cartao { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
