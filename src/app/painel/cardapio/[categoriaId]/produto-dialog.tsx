"use client";

import {
  type ReactElement,
  useActionState,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import {
  atualizarProduto,
  type CardapioState,
  criarProduto,
} from "../actions";

type Modelo = "simples" | "tamanhos" | "compartilhar";

export type ProdutoForm = {
  id: string;
  nome: string;
  descricao: string | null;
  modelo: Modelo;
  preco: number | null;
  preco_medio: number | null;
  preco_grande: number | null;
  preco_medio_label: string | null;
  preco_grande_label: string | null;
  serve_ate: number | null;
  imagemUrl: string | null;
  imagemLayout: "miniatura" | "grande";
};

const INITIAL: CardapioState = { error: null, ok: false };
const INPUT = "h-10 md:h-9";

const money = (n: number | null) =>
  n === null ? "" : n.toFixed(2).replace(".", ",");

export function ProdutoDialog({
  categoriaId,
  produto,
  trigger,
}: {
  categoriaId: string;
  produto?: ProdutoForm;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(produto);
  const fileRef = useRef<HTMLInputElement>(null);

  const [modelo, setModelo] = useState<Modelo>(produto?.modelo ?? "simples");
  const [preview, setPreview] = useState<string | null>(
    produto?.imagemUrl ?? null,
  );
  const [removida, setRemovida] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (prev: CardapioState, formData: FormData) => {
      const result = await (isEdit ? atualizarProduto : criarProduto)(
        prev,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        toast.success(isEdit ? "Produto atualizado." : "Produto criado.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  function resetImagem() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setRemovida(Boolean(produto?.imagemUrl));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            O modelo define quais preços aparecem.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="categoria_id" value={categoriaId} />
          {produto ? <input type="hidden" name="id" value={produto.id} /> : null}
          {removida ? (
            <input type="hidden" name="remover_imagem" value="true" />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              defaultValue={produto?.nome ?? ""}
              required
              autoFocus
              className={INPUT}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              name="descricao"
              defaultValue={produto?.descricao ?? ""}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <NativeSelect
              id="modelo"
              name="modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value as Modelo)}
              className={INPUT}
            >
              <option value="simples">Simples — preço único</option>
              <option value="tamanhos">Duas opções — com rótulos (ex.: Médio/Grande, Taça/Garrafa)</option>
              <option value="compartilhar">Para compartilhar</option>
            </NativeSelect>
          </div>

          {modelo === "tamanhos" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="preco_medio_label">Rótulo do 1º preço</Label>
                  <Input
                    id="preco_medio_label"
                    name="preco_medio_label"
                    defaultValue={produto?.preco_medio_label ?? "Médio"}
                    placeholder="Médio"
                    required
                    className={INPUT}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_medio">Preço</Label>
                  <Input
                    id="preco_medio"
                    name="preco_medio"
                    inputMode="decimal"
                    defaultValue={money(produto?.preco_medio ?? null)}
                    placeholder="0,00"
                    required
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="preco_grande_label">Rótulo do 2º preço</Label>
                  <Input
                    id="preco_grande_label"
                    name="preco_grande_label"
                    defaultValue={produto?.preco_grande_label ?? "Grande"}
                    placeholder="Grande"
                    required
                    className={INPUT}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_grande">Preço</Label>
                  <Input
                    id="preco_grande"
                    name="preco_grande"
                    inputMode="decimal"
                    defaultValue={money(produto?.preco_grande ?? null)}
                    placeholder="0,00"
                    required
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço</Label>
                <Input
                  id="preco"
                  name="preco"
                  inputMode="decimal"
                  defaultValue={money(produto?.preco ?? null)}
                  placeholder="0,00"
                  required
                  className={INPUT}
                />
              </div>
              {modelo === "compartilhar" ? (
                <div className="space-y-2">
                  <Label htmlFor="serve_ate">Serve até (pessoas)</Label>
                  <Input
                    id="serve_ate"
                    name="serve_ate"
                    inputMode="numeric"
                    defaultValue={produto?.serve_ate ?? ""}
                    placeholder="4"
                    className={INPUT}
                  />
                </div>
              ) : null}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="imagem">Imagem (opcional)</Label>
            {preview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt=""
                  className="size-16 rounded-md border object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetImagem}
                >
                  Remover
                </Button>
              </div>
            ) : null}
            <Input
              ref={fileRef}
              id="imagem"
              name="imagem"
              type="file"
              accept="image/*"
              className={INPUT}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPreview(URL.createObjectURL(f));
                  setRemovida(false);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              A imagem é convertida automaticamente para WebP.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagem_layout">Tamanho da imagem no cardápio</Label>
            <NativeSelect
              id="imagem_layout"
              name="imagem_layout"
              defaultValue={produto?.imagemLayout ?? "miniatura"}
              className={INPUT}
            >
              <option value="miniatura">Pequena, à esquerda</option>
              <option value="grande">Grande, centralizada</option>
            </NativeSelect>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending} className={INPUT}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
