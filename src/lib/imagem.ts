import "server-only";

import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "cardapio";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB antes da conversão
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
    return { ok: false, error: "Imagem muito grande (máx. 8 MB)." };
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
 * grava no bucket `cardapio` em `produtos/<produtoId>.webp` (upsert).
 * Regra de negócio do Módulo 1: todo upload de imagem vira WebP automaticamente.
 */
export async function salvarImagemProduto(
  produtoId: string,
  file: File,
): Promise<ResultadoImagem> {
  const convertido = await converterParaWebp(file, LARGURA_MAX);
  if (!convertido.ok) return convertido;

  const path = `produtos/${produtoId}.webp`;
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
