import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * <select> nativo estilizado. Usado nos formulários da Fase 1 por ser
 * totalmente compatível com envio de <form> + Server Actions, sem depender da
 * API de componentes do Base UI.
 */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
