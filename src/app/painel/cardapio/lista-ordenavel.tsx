"use client";

import { type ReactNode, useState, useTransition } from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import { reordenarItens } from "./actions";

export type ItemOrdenavel = { id: string; conteudo: ReactNode };

function LinhaOrdenavel({
  id,
  classeLinha,
  conteudo,
}: {
  id: string;
  classeLinha: string;
  conteudo: ReactNode;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${classeLinha} ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <button
        type="button"
        aria-label="Arrastar para reordenar"
        className="flex shrink-0 cursor-grab touch-none items-center self-stretch rounded-md px-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">{conteudo}</div>
    </li>
  );
}

/**
 * Lista com arrastar-e-soltar pra reordenar categorias ou produtos. Os setinhas
 * continuam no conteúdo de cada linha como alternativa.
 */
export function ListaOrdenavel({
  tabela,
  categoriaId,
  itens,
  classeLista,
  classeLinha,
}: {
  tabela: "categorias" | "produtos";
  categoriaId?: string;
  itens: ItemOrdenavel[];
  classeLista: string;
  classeLinha: string;
}) {
  const [ordem, setOrdem] = useState(itens);
  const [, startTransition] = useTransition();

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function aoSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;

    const anterior = ordem;
    const idsAntes = anterior.map((i) => i.id);
    const novaOrdem = arrayMove(
      anterior,
      idsAntes.indexOf(String(active.id)),
      idsAntes.indexOf(String(over.id)),
    );
    setOrdem(novaOrdem);

    startTransition(async () => {
      const resultado = await reordenarItens(
        tabela,
        novaOrdem.map((i) => i.id),
        categoriaId,
      );
      if ("error" in resultado) {
        setOrdem(anterior);
        toast.error(resultado.error);
      }
    });
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={aoSoltar}
    >
      <SortableContext
        items={ordem.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className={classeLista}>
          {ordem.map((item) => (
            <LinhaOrdenavel
              key={item.id}
              id={item.id}
              classeLinha={classeLinha}
              conteudo={item.conteudo}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
