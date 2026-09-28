"use client";

import { useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Foto de produto do cardápio público. Clicável em ambos os layouts
 * (miniatura/grande) — amplia num diálogo simples, sem esticar o layout do
 * card nem depender de lib de galeria.
 *
 * `<img>` simples de propósito, não next/image: o cardápio mostra até ~200
 * fotos na mesma página sem paginação/virtualização, e o next/image vira um
 * componente React com estado/efeito por instância — testado (28/09) e
 * piorou o Total Blocking Time de ~120ms pra 1.1-1.3s (o maior peso da nota
 * de Performance), mais caro que a banda que economizava. O tamanho de
 * arquivo é resolvido na origem (upload já converte pra WebP em tamanho
 * comedido — ver src/lib/imagem.ts), não redimensionando em tempo real.
 */
export function ImagemProduto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto${alt ? ` de ${alt}` : ""}`}
        className={cn("block shrink-0 cursor-zoom-in", className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full rounded-lg border object-cover"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[85svh] w-full rounded-xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
