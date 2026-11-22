import "server-only";

import sharp from "sharp";

import { selecionarImagensOrfas } from "@/lib/imagem-orfas";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "cardapio";
// 4 MB antes da conversão: é o teto da Server Action (next.config.ts) e da Vercel
// (4,5MB por requisição). O navegador já reduz a foto antes de enviar.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const LARGURA_MAX = 1280;

export type ResultadoImagem =
  | { ok: false; error: string }
  | { ok: true; path: string };

async function converterParaWebp(
  file: File,
  larguraMax: number,
): Promise<{ ok: false; error: string } | { ok: true; buffer: Buffer }> {
  if (!file || file.size === 0) return { ok: false, error: "Arquivo vazio." };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Envie um arquivo de imagem." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Imagem muito grande (máx. 4 MB)." };
  }
  try {
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: larguraMax, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return { ok: true, buffer };
  } catch {
    return { ok: false, error: "Não foi possível processar a imagem." };
  }
}

/**
 * Converte o arquivo enviado para WebP (redimensionado, com correção de EXIF) e
 * grava no bucket `cardapio` em `produtos/<produtoId>-<timestamp>.webp`.
 * Regra de negócio do Módulo 1: todo upload de imagem vira WebP automaticamente.
 *
 * Nome ÚNICO a cada envio, de propósito: com o nome fixo (`<produtoId>.webp`) a
 * foto nova substituía a antiga no mesmo endereço, e navegador/CDN seguiam
 * servindo a antiga do cache (~1h); além disso a troca valia na hora, sem
 * esperar o "Publicar". A foto antiga fica no storage até a próxima publicação
 * (o cardápio publicado ainda aponta pra ela) e aí é apagada por
 * `limparImagensOrfasProdutos`.
 */
export async function salvarImagemProduto(
  produtoId: string,
  file: File,
): Promise<ResultadoImagem> {
  const convertido = await converterParaWebp(file, LARGURA_MAX);
  if (!convertido.ok) return convertido;

  const path = `produtos/${produtoId}-${Date.now()}.webp`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, convertido.buffer, { contentType: "image/webp", upsert: true });
  if (error) return { ok: false, error: "Falha ao enviar a imagem." };

  return { ok: true, path };
}

/**
 * Logo do cabeçalho do cardápio público (`cardapio_config.logo_path`). Path
 * fixo — um novo upload substitui o anterior (upsert).
 */
export async function salvarLogoCardapio(file: File): Promise<ResultadoImagem> {
  const convertido = await converterParaWebp(file, 480);
  if (!convertido.ok) return convertido;

  const path = "marca/logo-cardapio.webp";
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, convertido.buffer, { contentType: "image/webp", upsert: true });
  if (error) return { ok: false, error: "Falha ao enviar a logo." };

  return { ok: true, path };
}

/**
 * Favicon do site (`sistema_config.favicon_path`) — aba do navegador, em
 * todas as páginas (cardápio público e painel admin). Path fixo, upsert.
 */
export async function salvarFaviconSistema(file: File): Promise<ResultadoImagem> {
  const convertido = await converterParaWebp(file, 256);
  if (!convertido.ok) return convertido;

  const path = "marca/favicon-sistema.webp";
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, convertido.buffer, { contentType: "image/webp", upsert: true });
  if (error) return { ok: false, error: "Falha ao enviar o favicon." };

  return { ok: true, path };
}

/**
 * Logo interna do sistema (`sistema_config.logo_path`) — tela de login,
 * sidebar do painel e cabeçalho do garçom. Path fixo, upsert.
 */
export async function salvarLogoSistema(file: File): Promise<ResultadoImagem> {
  const convertido = await converterParaWebp(file, 480);
  if (!convertido.ok) return convertido;

  const path = "marca/logo-sistema.webp";
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, convertido.buffer, { contentType: "image/webp", upsert: true });
  if (error) return { ok: false, error: "Falha ao enviar a logo." };

  return { ok: true, path };
}

/**
 * Apaga de `produtos/` os arquivos que nenhum produto usa mais (fotos
 * trocadas, removidas ou de produtos excluídos). Chamada depois de publicar:
 * nesse momento o cardápio publicado passa a ser igual ao rascunho, então o
 * que o rascunho não referencia também não é mais necessário ao público.
 * Best-effort — falhar aqui não pode impedir a publicação.
 */
export async function limparImagensOrfasProdutos(): Promise<void> {
  const supabase = createAdminClient();
  // `limit` alto de uma vez só: um restaurante tem dezenas/poucas centenas de fotos.
  const { data: arquivos } = await supabase.storage
    .from(BUCKET)
    .list("produtos", { limit: 1000 });
  if (!arquivos || arquivos.length === 0) return;

  const { data: usados } = await supabase
    .from("produtos")
    .select("imagem_path")
    .not("imagem_path", "is", null);
  const emUso = new Set((usados ?? []).map((p) => p.imagem_path as string));

  const orfas = selecionarImagensOrfas(arquivos, emUso, Date.now());
  if (orfas.length > 0) await supabase.storage.from(BUCKET).remove(orfas);
}

/** Remove um objeto do bucket `cardapio` (ignora se não existir). */
export async function removerImagemProduto(path: string): Promise<void> {
  if (!path) return;
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

/**
 * URL pública de um objeto do bucket `cardapio` a partir do path salvo no
 * banco (`produtos.imagem_path` ou `cardapio_config.logo_path`).
 */
export function urlImagemProduto(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
