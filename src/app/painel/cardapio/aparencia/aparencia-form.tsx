"use client";

import { useActionState, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { ARREDONDAMENTO_LABEL, RAIO_PX, type Arredondamento } from "@/lib/cardapio-tema";

import { type AparenciaState, salvarAparencia } from "./actions";

export type AparenciaConfig = {
  nome_estabelecimento: string;
  logoUrl: string | null;
  mostrar_nome_com_logo: boolean;
  cor_fundo: string;
  cor_fundo_cabecalho: string;
  cor_bloco: string;
  cor_destaque: string;
  sombra: boolean;
  arredondamento: Arredondamento;
  categorias_centralizadas: boolean;
};

const INITIAL: AparenciaState = { error: null, ok: false };
const INPUT = "h-10 md:h-9";

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={name}
          name={name}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <span className="text-sm text-muted-foreground uppercase">{value}</span>
      </div>
    </div>
  );
}

function ToggleField({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function PreviaCardapio({
  nome,
  logoPreview,
  mostrarNomeComLogo,
  corFundo,
  corCabecalho,
  corBloco,
  corDestaque,
  sombra,
  arredondamento,
  categoriasCentralizadas,
}: {
  nome: string;
  logoPreview: string | null;
  mostrarNomeComLogo: boolean;
  corFundo: string;
  corCabecalho: string;
  corBloco: string;
  corDestaque: string;
  sombra: boolean;
  arredondamento: Arredondamento;
  categoriasCentralizadas: boolean;
}) {
  const raio = RAIO_PX[arredondamento];
  const mostrarNome = !logoPreview || mostrarNomeComLogo;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        style={{ backgroundColor: corCabecalho }}
        className="flex items-center gap-2 border-b px-3 py-2"
      >
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="" className="h-7 w-auto object-contain" />
        ) : null}
        {mostrarNome ? (
          <span className="text-sm font-semibold">{nome || "Point07"}</span>
        ) : null}
      </div>
      <div style={{ backgroundColor: corFundo }} className="space-y-3 p-3">
        <p
          className={
            categoriasCentralizadas
              ? "text-center text-lg font-bold"
              : "text-sm font-semibold"
          }
        >
          Categoria de Exemplo
        </p>
        <div
          style={{ backgroundColor: corBloco, borderRadius: raio }}
          className={`p-3 ${sombra ? "shadow-md" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Produto de Exemplo</p>
              <p className="text-sm text-muted-foreground">
                Descrição do produto
              </p>
            </div>
            <p className="text-sm font-medium" style={{ color: corDestaque }}>
              R$ 29,90
            </p>
          </div>
          <div className="mt-2 space-y-1 border-t pt-2">
            <p className="text-xs font-semibold" style={{ color: corDestaque }}>
              Escolha 1 Opção
            </p>
            <div className="mt-1 flex gap-1.5">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                Opção A
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                Opção B
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="h-10 w-full rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: corDestaque }}
        >
          Chamar garçom
        </button>
      </div>
    </div>
  );
}

export function AparenciaForm({ config }: { config: AparenciaConfig }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(config.nome_estabelecimento);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoUrl);
  const [logoRemovida, setLogoRemovida] = useState(false);
  const [mostrarNomeComLogo, setMostrarNomeComLogo] = useState(
    config.mostrar_nome_com_logo,
  );
  const [corFundo, setCorFundo] = useState(config.cor_fundo);
  const [corCabecalho, setCorCabecalho] = useState(config.cor_fundo_cabecalho);
  const [corBloco, setCorBloco] = useState(config.cor_bloco);
  const [corDestaque, setCorDestaque] = useState(config.cor_destaque);
  const [sombra, setSombra] = useState(config.sombra);
  const [arredondamento, setArredondamento] = useState<Arredondamento>(
    config.arredondamento,
  );
  const [categoriasCentralizadas, setCategoriasCentralizadas] = useState(
    config.categorias_centralizadas,
  );

  const [state, formAction, pending] = useActionState(
    async (prev: AparenciaState, formData: FormData) => {
      const result = await salvarAparencia(prev, formData);
      if (result.ok) {
        toast.success("Aparência salva.");
        router.refresh();
      }
      return result;
    },
    INITIAL,
  );

  function removerLogo() {
    if (fileRef.current) fileRef.current.value = "";
    setLogoPreview(null);
    setLogoRemovida(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-5">
        {logoRemovida ? (
          <input type="hidden" name="remover_logo" value="true" />
        ) : null}
        <input type="hidden" name="sombra" value={sombra ? "true" : "false"} />
        <input
          type="hidden"
          name="categorias_centralizadas"
          value={categoriasCentralizadas ? "true" : "false"}
        />
        <input
          type="hidden"
          name="mostrar_nome_com_logo"
          value={mostrarNomeComLogo ? "true" : "false"}
        />

        <div className="space-y-2">
          <Label htmlFor="nome_estabelecimento">Nome do estabelecimento</Label>
          <Input
            id="nome_estabelecimento"
            name="nome_estabelecimento"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className={INPUT}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo">Logo do cabeçalho (opcional)</Label>
          {logoPreview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview}
                alt=""
                className="h-12 w-auto rounded border object-contain p-1"
              />
              <Button type="button" variant="ghost" size="sm" onClick={removerLogo}>
                Remover
              </Button>
            </div>
          ) : null}
          <Input
            ref={fileRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            className={INPUT}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setLogoPreview(URL.createObjectURL(f));
                setLogoRemovida(false);
              }
            }}
          />
        </div>

        <ToggleField
          id="mostrar_nome_com_logo_switch"
          label="Mostrar nome junto da logo"
          hint="Se desligado e houver logo, só ela aparece no cabeçalho."
          checked={mostrarNomeComLogo}
          onChange={setMostrarNomeComLogo}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorField
            label="Cor de fundo do cardápio"
            name="cor_fundo"
            value={corFundo}
            onChange={setCorFundo}
          />
          <ColorField
            label="Cor de fundo do cabeçalho"
            name="cor_fundo_cabecalho"
            value={corCabecalho}
            onChange={setCorCabecalho}
          />
          <ColorField
            label="Cor dos blocos de produto"
            name="cor_bloco"
            value={corBloco}
            onChange={setCorBloco}
          />
          <ColorField
            label="Cor de destaque"
            name="cor_destaque"
            value={corDestaque}
            onChange={setCorDestaque}
          />
        </div>

        <ToggleField
          id="sombra_switch"
          label="Sombra nos blocos de produto"
          checked={sombra}
          onChange={setSombra}
        />

        <div className="space-y-2">
          <Label htmlFor="arredondamento">Arredondamento dos cantos</Label>
          <NativeSelect
            id="arredondamento"
            name="arredondamento"
            value={arredondamento}
            onChange={(e) =>
              setArredondamento(e.target.value as Arredondamento)
            }
            className={INPUT}
          >
            {Object.entries(ARREDONDAMENTO_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </NativeSelect>
        </div>

        <ToggleField
          id="categorias_switch"
          label="Categorias centralizadas e em destaque"
          hint="Nome da categoria maior e centralizado, em vez de alinhado à esquerda."
          checked={categoriasCentralizadas}
          onChange={setCategoriasCentralizadas}
        />

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className={INPUT}>
          {pending ? "Salvando…" : "Salvar aparência"}
        </Button>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Prévia ao vivo
        </p>
        <PreviaCardapio
          nome={nome}
          logoPreview={logoPreview}
          mostrarNomeComLogo={mostrarNomeComLogo}
          corFundo={corFundo}
          corCabecalho={corCabecalho}
          corBloco={corBloco}
          corDestaque={corDestaque}
          sombra={sombra}
          arredondamento={arredondamento}
          categoriasCentralizadas={categoriasCentralizadas}
        />
      </div>
    </div>
  );
}
