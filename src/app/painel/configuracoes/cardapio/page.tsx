import Link from "next/link";

import { urlImagemProduto } from "@/lib/imagem";
import { createClient } from "@/lib/supabase/server";

import { AparenciaForm } from "./aparencia-form";

export const metadata = { title: "Aparência do Cardápio — Point07" };

export default async function AparenciaCardapioPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("cardapio_config")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/configuracoes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Configurações
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Aparência do cardápio</h1>
        <p className="text-sm text-muted-foreground">
          Cores, sombra, arredondamento e logo do cardápio público
          (/cardapio e o QR das mesas).
        </p>
      </div>

      <AparenciaForm
        config={{
          nome_estabelecimento: config?.nome_estabelecimento ?? "Point07",
          logoUrl: urlImagemProduto(config?.logo_path ?? null),
          logo_posicao: config?.logo_posicao ?? "esquerda",
          logo_tamanho: config?.logo_tamanho ?? "medio",
          mostrar_nome_com_logo: config?.mostrar_nome_com_logo ?? true,
          cor_fundo: config?.cor_fundo ?? "#f5f5f4",
          cor_fundo_cabecalho: config?.cor_fundo_cabecalho ?? "#ffffff",
          cor_texto_cabecalho: config?.cor_texto_cabecalho ?? "#111111",
          cor_bloco: config?.cor_bloco ?? "#ffffff",
          cor_destaque: config?.cor_destaque ?? "#f07e22",
          cor_categoria_nav_fundo: config?.cor_categoria_nav_fundo ?? "#ffffff",
          cor_categoria_nav_fundo_ativa:
            config?.cor_categoria_nav_fundo_ativa ?? "#ffffff",
          sombra: config?.sombra ?? true,
          arredondamento: config?.arredondamento ?? "medio",
          categorias_centralizadas: config?.categorias_centralizadas ?? false,
          descricao_caixa: config?.descricao_caixa ?? "original",
        }}
      />
    </div>
  );
}
