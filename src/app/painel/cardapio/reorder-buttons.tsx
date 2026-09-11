import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import { moverItem } from "./actions";

export function ReorderButtons({
  tabela,
  id,
  categoriaId,
  produtoId,
  primeiro,
  ultimo,
}: {
  tabela: "categorias" | "produtos" | "avisos" | "produto_grupos_opcoes";
  id: string;
  categoriaId?: string;
  produtoId?: string;
  primeiro: boolean;
  ultimo: boolean;
}) {
  return (
    <div className="flex flex-col">
      {(["cima", "baixo"] as const).map((direcao) => (
        <form action={moverItem} key={direcao}>
          <input type="hidden" name="tabela" value={tabela} />
          <input type="hidden" name="id" value={id} />
          {categoriaId ? (
            <input type="hidden" name="categoria_id" value={categoriaId} />
          ) : null}
          {produtoId ? (
            <input type="hidden" name="produto_id" value={produtoId} />
          ) : null}
          <input type="hidden" name="direcao" value={direcao} />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            disabled={direcao === "cima" ? primeiro : ultimo}
            aria-label={direcao === "cima" ? "Mover para cima" : "Mover para baixo"}
          >
            {direcao === "cima" ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </form>
      ))}
    </div>
  );
}
