// Migração do cardápio real (WordPress → Point07) — passo 2: importar.
//
// Lê produtos-revisao.csv (gerado e revisado a partir do passo 1) e escreve
// de verdade no Supabase LOCAL: cria categorias, produtos, baixa cada
// imagem da URL do WordPress e converte pro mesmo pipeline WebP que o
// painel usa (src/lib/imagem.ts) — reimplementado aqui porque este é um
// script Node solto, fora do Next (não dá pra importar "server-only").
//
// Idempotente: rodar de novo não duplica — casa por nome dentro da mesma
// categoria e atualiza em vez de inserir de novo.
//
// Rode com: node scripts/migracao-cardapio/2-importar.mjs
// Pra apontar pra outro ambiente (ex.: produção): node 2-importar.mjs --env=.env.production.local
// (esse .env.production.local é gitignored — nunca commitar).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "produtos-revisao.csv");
const BUCKET = "cardapio";
const LARGURA_MAX = 1280;

function lerEnvLocal() {
  const arg = process.argv.find((a) => a.startsWith("--env="));
  const nomeArquivo = arg ? arg.slice("--env=".length) : ".env.local";
  const envPath = path.join(__dirname, "../..", nomeArquivo);
  const env = {};
  for (const linha of readFileSync(envPath, "utf-8").split("\n")) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

/** Parser de CSV simples com suporte a campos entre aspas (RFC 4180 básico). */
function parseCsv(texto) {
  const linhas = [];
  let campo = "", linha = [], dentroAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentroAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentroAspas = false;
      else campo += c;
    } else if (c === '"') {
      dentroAspas = true;
    } else if (c === ",") {
      linha.push(campo); campo = "";
    } else if (c === "\r") {
      // ignora
    } else if (c === "\n") {
      linha.push(campo); campo = "";
      linhas.push(linha); linha = [];
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || linha.length > 0) { linha.push(campo); linhas.push(linha); }
  const [header, ...resto] = linhas.filter((l) => l.length > 1 || l[0] !== "");
  return resto.map((l) => Object.fromEntries(header.map((h, i) => [h, l[i] ?? ""])));
}

function numOuNull(v) {
  if (v === "" || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function strOuNull(v) {
  return v === "" || v === undefined ? null : v;
}

async function baixarEConverterImagem(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return sharp(buffer)
    .rotate()
    .resize({ width: LARGURA_MAX, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function main() {
  const env = lerEnvLocal();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const linhas = parseCsv(readFileSync(CSV_PATH, "utf-8").replace(/^﻿/, ""));
  console.log(`Lidas ${linhas.length} linhas do CSV.`);

  // --- Categorias: cria as que não existem ainda, na ordem de 1ª aparição.
  const categoriasUnicas = [...new Set(linhas.map((l) => l.categoria))];
  const categoriaIdPorNome = {};
  const { data: existentes } = await supabase.from("categorias").select("id, nome, ordem");
  let proximaOrdemCategoria = Math.max(-1, ...(existentes ?? []).map((c) => c.ordem)) + 1;
  for (const c of existentes ?? []) categoriaIdPorNome[c.nome] = c.id;

  for (const nome of categoriasUnicas) {
    if (categoriaIdPorNome[nome]) continue;
    const { data, error } = await supabase
      .from("categorias")
      .insert({ nome, ordem: proximaOrdemCategoria++, ativo: true })
      .select("id")
      .single();
    if (error) { console.error(`Falha ao criar categoria "${nome}":`, error.message); continue; }
    categoriaIdPorNome[nome] = data.id;
    console.log(`+ categoria: ${nome}`);
  }

  // --- Produtos
  let criados = 0, atualizados = 0, falhas = 0;
  let imagensOk = 0, imagensFalha = 0, imagensPuladas = 0;

  for (const l of linhas) {
    const categoria_id = categoriaIdPorNome[l.categoria];
    if (!categoria_id) { console.error(`Sem categoria pra "${l.nome}" (${l.categoria})`); falhas++; continue; }

    const dados = {
      categoria_id,
      nome: l.nome,
      descricao: strOuNull(l.descricao),
      modelo: l.modelo,
      preco: numOuNull(l.preco),
      preco_medio: numOuNull(l.preco_medio),
      preco_grande: numOuNull(l.preco_grande),
      preco_medio_label: strOuNull(l.preco_medio_label),
      preco_grande_label: strOuNull(l.preco_grande_label),
      serve_ate: l.serve_ate ? Number.parseInt(l.serve_ate, 10) : null,
      ordem: Number.parseInt(l.ordem, 10) || 0,
      ativo: l.ativo === "true",
    };

    // ilike (case-insensitive): o WP manda tudo em CAIXA ALTA, mas produtos
    // já cadastrados à mão (ex.: seed) usam Title Case — não pode duplicar
    // só por causa da caixa.
    const { data: existenteRows } = await supabase
      .from("produtos")
      .select("id, imagem_path, produto_grupos_opcoes(count)")
      .eq("categoria_id", categoria_id)
      .ilike("nome", l.nome);
    const existente = existenteRows?.[0];

    // Produto já cadastrado à mão com grupos de opções (ex.: "Batata Recheada"
    // no seed, com "Escolha 1 carne"/"Escolha 2 complementos" de verdade) é
    // mais rico do que este importador consegue reproduzir — não sobrescreve.
    if (existente && (existente.produto_grupos_opcoes?.[0]?.count ?? 0) > 0) {
      console.log(`= pulado (já tem grupos de opções configurados): ${l.nome}`);
      continue;
    }

    let produtoId = existente?.id;
    if (existente) {
      const { error } = await supabase.from("produtos").update(dados).eq("id", existente.id);
      if (error) { console.error(`Falha ao atualizar "${l.nome}":`, error.message); falhas++; continue; }
      atualizados++;
    } else {
      const { data, error } = await supabase.from("produtos").insert(dados).select("id").single();
      if (error) { console.error(`Falha ao criar "${l.nome}":`, error.message); falhas++; continue; }
      produtoId = data.id;
      criados++;
    }

    if (existente?.imagem_path) { imagensPuladas++; continue; } // já tem imagem, não baixa de novo
    if (!l.imagem_url) continue;

    try {
      const webp = await baixarEConverterImagem(l.imagem_url);
      const objectPath = `produtos/${produtoId}.webp`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, webp, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      await supabase.from("produtos").update({ imagem_path: objectPath }).eq("id", produtoId);
      imagensOk++;
    } catch (err) {
      console.error(`Falha na imagem de "${l.nome}" (${l.imagem_url}):`, err.message ?? err);
      imagensFalha++;
    }
  }

  console.log("\n=== Resumo ===");
  console.log(`Categorias: ${categoriasUnicas.length} (${Object.keys(categoriaIdPorNome).length - (existentes?.length ?? 0)} novas)`);
  console.log(`Produtos criados: ${criados} | atualizados: ${atualizados} | falhas: ${falhas}`);
  console.log(`Imagens baixadas: ${imagensOk} | já existiam (puladas): ${imagensPuladas} | falharam: ${imagensFalha}`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
