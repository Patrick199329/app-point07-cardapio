"use client";

import { useState } from "react";

import Image from "next/image";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Foto de produto do cardápio público. Clicável em ambos os layouts
 * (miniatura/grande) — amplia num diálogo simples, sem esticar o layout do
 * card nem depender de lib de galeria.
 *
 * A miniatura usa next/image (`fill`) pra baixar só o tamanho de exibição
 * real — as fotos são salvas com até 1280px de largura (src/lib/imagem.ts),
 * bem mais que os ~64px de uma miniatura; o otimizador da Vercel resolve
 * isso sem precisar do plano pago de transformação de imagem do Supabase.
 * O diálogo ampliado continua com `<img>` simples: o tamanho de exibição ali
 * depende da proporção da foto, que só se sabe depois de carregada — não dá
 * pra usar `fill` sem já saber as dimensões.
 */
export function ImagemProduto({
  src,
  alt,
  className,
  sizes = "64px",
}: {
  src: string;
  alt: string;
  className?: string;
  /** Repassado pro next/image — a largura real de exibição neste contexto. */
  sizes?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto${alt ? ` de ${alt}` : ""}`}
        className={cn("relative block shrink-0 cursor-zoom-in", className)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="rounded-lg border object-cover"
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
