"use client";

import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Módulo 2: o botão "Chamar garçom" faz parte do cardápio público. A chamada em
 * si (fila em tempo real + aceite exclusivo) é o Módulo 3 — próxima entrega.
 * Até lá o botão fica visível e avisa que está por vir.
 */
export function ChamarGarcomButton() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
      <Button
        size="lg"
        className="pointer-events-auto h-12 rounded-full px-6 shadow-lg"
        onClick={() =>
          toast("Chamar garçom", {
            description: "Disponível em breve. Por enquanto, chame um garçom no salão.",
          })
        }
      >
        <BellRing className="size-5" />
        Chamar garçom
      </Button>
    </div>
  );
}
