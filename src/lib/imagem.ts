import "server-only";

import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "cardapio";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB antes da conversão
const LARGURA_MAX = 1280;

export type ResultadoImagem =
  | { ok: false; error: string }
  | { ok: true; path: string };

/**
 * Converte o arquivo enviado para WebP (redimensionado, com correção de EXIF) e
 * grava no bucket `cardapio` em `produtos/<produtoId>.webp` (upsert).
 * Regra de negócio do Módulo 1: todo upload de imagem vira WebP automaticamente.
 */
export async function salvarImagemProduto(
  produtoId: string,
  file: File,
): Promise<ResultadoImagem> {
  if (!file || file.size === 0) return { ok: false, error: "Arquivo vazio." };
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Envie um arquivo de imagem." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Imagem muito grande (máx. 8 MB)." };
  }

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: LARGURA_MAX, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { ok: false, error: "Não foi possível processar a imagem." };
  }

  const path = `produtos/${produtoId}.webp`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, webp, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) return { ok: false, error: "Falha ao enviar a imagem." };

  return { ok: true, path };
}

/** Remove o objeto de imagem de um produto (ignora se não existir). */
export async function removerImagemProduto(path: string): Promise<void> {
  if (!path) return;
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

/** URL pública da imagem a partir do path salvo em produtos.imagem_path. */
export function urlImagemProduto(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
