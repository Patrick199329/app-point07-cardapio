"use client";

import { useActionState, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import {
  ARREDONDAMENTO_LABEL,
  type Arredondamento,
  DESCRICAO_CAIXA_LABEL,
  type DescricaoCaixa,
  formatarDescricao,
  LOGO_ALTURA_PX,
  LOGO_POSICAO_LABEL,
  LOGO_TAMANHO_LABEL,
  type LogoPosicao,
  type LogoTamanho,
  RAIO_PX,
} from "@/lib/cardapio-tema";

import { type AparenciaState, salvarAparencia } from "./actions";

export type AparenciaConfig = {
  nome_estabelecimento: string;
  logoUrl: string | null;
  logo_posicao: LogoPosicao;
  logo_tamanho: LogoTamanho;
  mostrar_nome_com_logo: boolean;
  cor_fundo: string;
  cor_fundo_cabecalho: string;
  cor_texto_cabecalho: string;
  cor_bloco: string;
  cor_destaque: string;
  cor_categoria_nav_fundo: string;
  cor_categoria_nav_fundo_ativa: string;
  sombra: boolean;
  arredondamento: Arredondamento;
  categorias_centralizadas: boolean;
  agrupar_categorias: boolean;
  descricao_caixa: DescricaoCaixa;
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
  logoPosicao,
  logoTamanho,
  mostrarNomeComLogo,
  corFundo,
  corCabecalho,
  corTextoCabecalho,
  corBloco,
  corDestaque,
  corCategoriaNavFundo,
  corCategoriaNavFundoAtiva,
  sombra,
  arredondamento,
  categoriasCentralizadas,
  agruparCategorias,
  descricaoCaixa,
}: {
  nome: string;
  logoPreview: string | null;
  logoPosicao: LogoPosicao;
  logoTamanho: LogoTamanho;
  mostrarNomeComLogo: boolean;
  corFundo: string;
  corCabecalho: string;
  corTextoCabecalho: string;
  corBloco: string;
  corDestaque: string;
  corCategoriaNavFundo: string;
  corCategoriaNavFundoAtiva: string;
  sombra: boolean;
  arredondamento: Arredondamento;
  categoriasCentralizadas: boolean;
  agruparCategorias: boolean;
  descricaoCaixa: DescricaoCaixa;
}) {
  const raio = RAIO_PX[arredondamento];
  const mostrarNome = !logoPreview || mostrarNomeComLogo;
  // Prévia em miniatura: metade da altura real, pra não dominar o cartão.
  const alturaLogo = LOGO_ALTURA_PX[logoTamanho] / 2;
  const alinhamento =
    logoPosicao === "centro"
      ? "justify-center"
      : logoPosicao === "direita"
        ? "justify-end"
        : "justify-start";
  const tituloCategoria = (
    <span
      className={
        categoriasCentralizadas
          ? "w-full text-center text-lg font-bold"
          : "text-sm font-semibold"
      }
    >
      Categoria de Exemplo
    </span>
  );
  const produtoExemplo = (
    <div
      style={{ backgroundColor: corBloco, borderRadius: raio }}
      className={`p-3 ${sombra ? "shadow-md" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Produto de Exemplo</p>
          <p className="text-sm text-muted-foreground">
            {formatarDescricao(
              "CONTRA FILE suculento, Macio com TEMPERO especial da casa",
              descricaoCaixa,
            )}
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
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        style={{ backgroundColor: corCabecalho, color: corTextoCabecalho }}
        className={`flex items-center gap-2 border-b px-3 py-2 ${alinhamento}`}
      >
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreview}
            alt=""
            style={{ height: alturaLogo }}
            className="w-auto object-contain"
          />
        ) : null}
        {mostrarNome ? (
          <span className="text-sm font-semibold">{nome || "Point07"}</span>
        ) : null}
      </div>
      <div
        style={{ backgroundColor: corCabecalho, color: corTextoCabecalho }}
        className="flex gap-2 overflow-x-auto border-b px-3 py-2"
      >
        {["Bebidas", "Porções", "Pizzas", "Sobremesas"].map((nome, i) => (
          <span
            key={nome}
            style={
              i === 0
                ? {
                    backgroundColor: corCategoriaNavFundoAtiva,
                    borderColor: corDestaque,
                    color: corDestaque,
                  }
                : { backgroundColor: corCategoriaNavFundo, borderColor: "currentColor" }
            }
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
              i === 0 ? "font-medium" : "opacity-70"
            }`}
          >
            {nome}
          </span>
        ))}
      </div>
      <div style={{ backgroundColor: corFundo }} className="space-y-3 p-3">
        {agruparCategorias ? (
          <details key="agrupado" open>
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg bg-white/70 px-3 py-2 shadow-sm">
              {tituloCategoria}
              <span aria-hidden="true" style={{ color: corDestaque }}>
                ⌄
              </span>
            </summary>
            <div className="mt-3">{produtoExemplo}</div>
          </details>
        ) : (
          <>
            <p>{tituloCategoria}</p>
            {produtoExemplo}
          </>
        )}
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
  const [logoPosicao, setLogoPosicao] = useState<LogoPosicao>(
    config.logo_posicao,
  );
  const [logoTamanho, setLogoTamanho] = useState<LogoTamanho>(
    config.logo_tamanho,
  );
  const [mostrarNomeComLogo, setMostrarNomeComLogo] = useState(
    config.mostrar_nome_com_logo,
  );
  const [corFundo, setCorFundo] = useState(config.cor_fundo);
  const [corCabecalho, setCorCabecalho] = useState(config.cor_fundo_cabecalho);
  const [corTextoCabecalho, setCorTextoCabecalho] = useState(
    config.cor_texto_cabecalho,
  );
  const [corBloco, setCorBloco] = useState(config.cor_bloco);
  const [corDestaque, setCorDestaque] = useState(config.cor_destaque);
  const [corCategoriaNavFundo, setCorCategoriaNavFundo] = useState(
    config.cor_categoria_nav_fundo,
  );
  const [corCategoriaNavFundoAtiva, setCorCategoriaNavFundoAtiva] = useState(
    config.cor_categoria_nav_fundo_ativa,
  );
  const [sombra, setSombra] = useState(config.sombra);
  const [arredondamento, setArredondamento] = useState<Arredondamento>(
    config.arredondamento,
  );
  const [categoriasCentralizadas, setCategoriasCentralizadas] = useState(
    config.categorias_centralizadas,
  );
  const [agruparCategorias, setAgruparCategorias] = useState(
    config.agrupar_categorias,
  );
  const [descricaoCaixa, setDescricaoCaixa] = useState<DescricaoCaixa>(
    config.descricao_caixa,
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
          name="agrupar_categorias"
          value={agruparCategorias ? "true" : "false"}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logo_posicao">Posição da logo</Label>
            <NativeSelect
              id="logo_posicao"
              name="logo_posicao"
              value={logoPosicao}
              onChange={(e) => setLogoPosicao(e.target.value as LogoPosicao)}
              className={INPUT}
            >
              {Object.entries(LOGO_POSICAO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_tamanho">Tamanho da logo</Label>
            <NativeSelect
              id="logo_tamanho"
              name="logo_tamanho"
              value={logoTamanho}
              onChange={(e) => setLogoTamanho(e.target.value as LogoTamanho)}
              className={INPUT}
            >
              {Object.entries(LOGO_TAMANHO_LABEL).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </NativeSelect>
          </div>
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
            label="Cor do texto do cabeçalho"
            name="cor_texto_cabecalho"
            value={corTextoCabecalho}
            onChange={setCorTextoCabecalho}
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
          <ColorField
            label="Fundo dos botões de categoria"
            name="cor_categoria_nav_fundo"
            value={corCategoriaNavFundo}
            onChange={setCorCategoriaNavFundo}
          />
          <ColorField
            label="Fundo do botão de categoria em foco"
            name="cor_categoria_nav_fundo_ativa"
            value={corCategoriaNavFundoAtiva}
            onChange={setCorCategoriaNavFundoAtiva}
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

        <ToggleField
          id="agrupar_categorias_switch"
          label="Agrupar itens por categoria"
          hint="Exibe cada categoria como um bloco que abre e fecha ao tocar no nome."
          checked={agruparCategorias}
          onChange={setAgruparCategorias}
        />

        <div className="space-y-2">
          <Label htmlFor="descricao_caixa">
            Caixa da descrição dos produtos
          </Label>
          <NativeSelect
            id="descricao_caixa"
            name="descricao_caixa"
            value={descricaoCaixa}
            onChange={(e) =>
              setDescricaoCaixa(e.target.value as DescricaoCaixa)
            }
            className={INPUT}
          >
            {Object.entries(DESCRICAO_CAIXA_LABEL).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            Os dados migrados do WordPress vêm sem padrão (uns em CAIXA ALTA,
            outros não). Isso só muda como aparece no cardápio público — o
            texto salvo continua do jeito que foi cadastrado.
          </p>
        </div>

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
          logoPosicao={logoPosicao}
          logoTamanho={logoTamanho}
          mostrarNomeComLogo={mostrarNomeComLogo}
          corFundo={corFundo}
          corCabecalho={corCabecalho}
          corTextoCabecalho={corTextoCabecalho}
          corBloco={corBloco}
          corDestaque={corDestaque}
          corCategoriaNavFundo={corCategoriaNavFundo}
          corCategoriaNavFundoAtiva={corCategoriaNavFundoAtiva}
          sombra={sombra}
          arredondamento={arredondamento}
          categoriasCentralizadas={categoriasCentralizadas}
          agruparCategorias={agruparCategorias}
          descricaoCaixa={descricaoCaixa}
        />
      </div>
    </div>
  );
}
