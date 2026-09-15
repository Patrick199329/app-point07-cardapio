// Migração do cardápio real (WordPress → Point07) — passo 1: extrair.
//
// Lê o export WXR (docs/point07.WordPress.*.xml) e gera uma planilha de
// revisão (produtos-revisao.csv) com uma linha por produto, já aplicando as
// decisões combinadas com o cliente:
//   - status "private" no WP -> ativo=false aqui (fica no painel, não some)
//   - pares de preço (dose/litro, taça/garrafa, unidade/balde de 5) viram o
//     modelo "tamanhos" com rótulo próprio SÓ quando as duas pontas têm um
//     preço real; senão vira "simples" com o preço que existe (evita mostrar
//     "R$ 0,00" ou "-" no cardápio público)
//   - anotações dentro do próprio valor de preço (ex.: "(SOMENTE PARA
//     VIAGEM)") são destacadas na coluna de observação, não descartadas
//
// Rode com: node scripts/migracao-cardapio/1-extrair.mjs
// Gera: scripts/migracao-cardapio/produtos-revisao.csv
//
// PRÓXIMO PASSO: abrir o CSV numa planilha, revisar linha a linha (e
// principalmente as linhas com algo na coluna "observacao"), corrigir o que
// precisar (nome, descrição, categoria, preço, ativo) e SALVAR COMO CSV de
// novo. O importador (2-importar.mjs) lê esse mesmo arquivo.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XML_PATH = path.join(__dirname, "../../docs/point07.WordPress.2026-09-15.xml");
const OUT_CSV = path.join(__dirname, "produtos-revisao.csv");

const IGNORAR_POST_TYPES = new Set([
  "attachment",
  "elementor_library",
  "wp_navigation",
  "wp_global_styles",
  "page",
  "banner",
  "promocao",
]);

// post_type -> categoria final (consolida os que são a mesma seção no site).
const CATEGORIA_OVERRIDE = {
  entrada_tira_gosto: "Porções",
  porcoes: "Porções",
};

function humanizar(slug) {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getMetas(itemXml) {
  const metas = {};
  const blocos = itemXml.match(/<wp:postmeta>[\s\S]*?<\/wp:postmeta>/g) ?? [];
  for (const b of blocos) {
    const k = b.match(/<wp:meta_key><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_key>/);
    const v = b.match(/<wp:meta_value><!\[CDATA\[([\s\S]*?)\]\]><\/wp:meta_value>/);
    if (k) metas[k[1]] = v ? v[1] : "";
  }
  return metas;
}

/** "R$ 12,90" -> 12.9. Também separa anotação tipo "(SOMENTE PARA VIAGEM)". */
function parsePreco(raw) {
  if (!raw) return { valor: null, nota: null };
  const texto = raw.trim();
  if (!texto || texto === "0" || texto === "-") return { valor: null, nota: null };
  const numMatch = texto.match(/(\d[\d.,]*)/);
  if (!numMatch) return { valor: null, nota: texto };
  const valor = Number(numMatch[1].replace(/\./g, "").replace(",", "."));
  const resto = texto.replace(numMatch[0], "").replace(/^R\$\s*/, "").trim();
  const nota = resto && resto !== "R$" ? resto.replace(/^[-–\s]+|[-–\s]+$/g, "") : null;
  return { valor: Number.isFinite(valor) ? valor : null, nota };
}

function csvEscape(v) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const xml = readFileSync(XML_PATH, "utf-8");
const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

// Mapa post_id (attachment) -> URL pública da imagem.
const imagemPorId = {};
for (const it of items) {
  const ptm = it.match(/<wp:post_type><!\[CDATA\[([^\]]*)\]\]><\/wp:post_type>/);
  if (!ptm || ptm[1] !== "attachment") continue;
  const idm = it.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
  const urlm = it.match(/<wp:attachment_url><!\[CDATA\[([^\]]*)\]\]><\/wp:attachment_url>/);
  if (idm && urlm) imagemPorId[idm[1]] = urlm[1];
}

// Rótulo de categoria por post_type (usa a primeira ocorrência com a tag; cai
// pro slug "humanizado" se nenhum item daquele tipo tiver a tag).
const rotuloPorTipo = {};
for (const it of items) {
  const ptm = it.match(/<wp:post_type><!\[CDATA\[([^\]]*)\]\]><\/wp:post_type>/);
  if (!ptm || IGNORAR_POST_TYPES.has(ptm[1]) || rotuloPorTipo[ptm[1]]) continue;
  const catm = it.match(/<category domain="categoria"[^>]*><!\[CDATA\[([^\]]*)\]\]><\/category>/);
  if (catm) rotuloPorTipo[ptm[1]] = catm[1];
}

const linhas = [];
let ordemPorCategoria = {};

for (const it of items) {
  const ptm = it.match(/<wp:post_type><!\[CDATA\[([^\]]*)\]\]><\/wp:post_type>/);
  const postType = ptm?.[1];
  if (!postType || IGNORAR_POST_TYPES.has(postType)) continue;

  const wpId = it.match(/<wp:post_id>(\d+)<\/wp:post_id>/)?.[1] ?? "";
  const status = it.match(/<wp:status><!\[CDATA\[([^\]]*)\]\]><\/wp:status>/)?.[1] ?? "";
  const titulo = it.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/)?.[1]?.trim() ?? "";
  const metas = getMetas(it);

  const categoria =
    CATEGORIA_OVERRIDE[postType] ??
    rotuloPorTipo[postType] ??
    humanizar(postType);

  const nome = (metas.nome || titulo).trim();
  let descricao = (metas.descricao || "").trim();
  const observacoes = [];

  let modelo = "simples";
  let preco = null;
  let precoMedio = null;
  let precoGrande = null;
  let precoMedioLabel = null;
  let precoGrandeLabel = null;
  let serveAte = null;

  if (postType === "tabuas_especiais") {
    modelo = "compartilhar";
    preco = parsePreco(metas.preco).valor;
  } else if (postType === "porcoes" || postType === "entrada_tira_gosto") {
    modelo = "tamanhos";
    precoMedio = parsePreco(metas.medio).valor;
    precoGrande = parsePreco(metas.grande).valor;
    precoMedioLabel = "Médio";
    precoGrandeLabel = "Grande";
  } else if (postType === "cachaca_de_sabores") {
    const dose = parsePreco(metas.dose);
    const litro = parsePreco(metas.litro);
    if (dose.valor !== null && litro.valor !== null) {
      modelo = "tamanhos";
      precoMedio = dose.valor;
      precoGrande = litro.valor;
      precoMedioLabel = "Dose";
      precoGrandeLabel = "Litro";
    } else {
      modelo = "simples";
      preco = dose.valor ?? litro.valor;
      if (dose.valor === null && litro.valor !== null) {
        observacoes.push("só tinha preço de litro (sem dose) — conferir");
      }
    }
    if (litro.nota) observacoes.push(`litro: "${litro.nota}"`);
    if (dose.nota) observacoes.push(`dose: "${dose.nota}"`);
  } else if (postType === "vinhos") {
    const taca = parsePreco(metas.taca);
    const garrafa = parsePreco(metas.garrafa);
    if (taca.valor !== null && garrafa.valor !== null) {
      modelo = "tamanhos";
      precoMedio = taca.valor;
      precoGrande = garrafa.valor;
      precoMedioLabel = "Taça";
      precoGrandeLabel = "Garrafa";
    } else {
      modelo = "simples";
      preco = taca.valor ?? garrafa.valor;
    }
  } else if (postType === "long_neck") {
    const unidade = parsePreco(metas.unidade);
    const balde = parsePreco(metas.balde_5_unidades);
    if (unidade.valor !== null && balde.valor !== null) {
      modelo = "tamanhos";
      precoMedio = unidade.valor;
      precoGrande = balde.valor;
      precoMedioLabel = "Unidade";
      precoGrandeLabel = "Balde de 5";
    } else {
      modelo = "simples";
      preco = unidade.valor;
    }
  } else {
    const p = parsePreco(metas.preco);
    preco = p.valor;
    if (p.nota) observacoes.push(`preço original: "${p.nota}"`);
  }

  if (modelo === "simples" && preco === null) {
    observacoes.push("SEM PREÇO — precisa ser preenchido antes de importar");
  }

  const thumbId = metas._thumbnail_id;
  const imagemUrl = thumbId ? imagemPorId[thumbId] ?? "" : "";
  if (thumbId && !imagemUrl) observacoes.push("tinha _thumbnail_id mas a imagem não foi encontrada no export");
  if (!thumbId) observacoes.push("sem imagem no WordPress");

  ordemPorCategoria[categoria] = (ordemPorCategoria[categoria] ?? -1) + 1;

  linhas.push({
    id_wp: wpId,
    post_type: postType,
    categoria,
    nome,
    descricao,
    modelo,
    preco,
    preco_medio: precoMedio,
    preco_grande: precoGrande,
    preco_medio_label: precoMedioLabel,
    preco_grande_label: precoGrandeLabel,
    serve_ate: serveAte,
    ativo: status === "publish",
    status_wp: status,
    ordem: ordemPorCategoria[categoria],
    imagem_url: imagemUrl,
    observacao: observacoes.join(" | "),
  });
}

// Caso especial: "BATATA RECHEADA" no WP não é 5 produtos — é 1 produto com
// preço + 4 "itens" que na verdade são as regras de montagem (escolha de
// carne/complementos, preço do acréscimo). Junta tudo na descrição do único
// produto real da categoria e descarta as linhas-instrução (senão viram
// "produtos" fantasmas de R$ 0,00 no cardápio público).
{
  const doCategoria = linhas.filter((l) => l.post_type === "batata_recheada");
  const principal = doCategoria.find((l) => l.preco !== null);
  const instrucoes = doCategoria.filter((l) => l.preco === null);
  if (principal && instrucoes.length > 0) {
    const extra = instrucoes.map((l) => `${l.nome}: ${l.descricao}`).join(". ");
    principal.descricao = [principal.descricao, extra].filter(Boolean).join(" — ");
    principal.observacao = [
      principal.observacao,
      `descrição enriquecida com ${instrucoes.length} linha(s) de instrução do WP (não eram produtos) — conferir texto`,
    ].filter(Boolean).join(" | ");
    for (const l of instrucoes) linhas.splice(linhas.indexOf(l), 1);
  }
}

const colunas = [
  "id_wp", "post_type", "categoria", "nome", "descricao", "modelo",
  "preco", "preco_medio", "preco_grande", "preco_medio_label", "preco_grande_label",
  "serve_ate", "ativo", "status_wp", "ordem", "imagem_url", "observacao",
];

const csv = [
  colunas.join(","),
  ...linhas.map((l) => colunas.map((c) => csvEscape(l[c])).join(",")),
].join("\n");

writeFileSync(OUT_CSV, "﻿" + csv, "utf-8"); // BOM pro Excel abrir acentuação certa

// Relatório resumido no terminal.
const porCategoria = {};
for (const l of linhas) {
  porCategoria[l.categoria] = (porCategoria[l.categoria] ?? 0) + 1;
}
console.log(`Total de itens extraídos: ${linhas.length}`);
console.log(`Categorias (${Object.keys(porCategoria).length}):`);
for (const [cat, n] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${cat}`);
}
console.log(`\nAtivos (publish): ${linhas.filter((l) => l.ativo).length}`);
console.log(`Inativos (private): ${linhas.filter((l) => !l.ativo).length}`);
console.log(`Linhas com observação (revisar): ${linhas.filter((l) => l.observacao).length}`);
console.log(`\nCSV gerado em: ${OUT_CSV}`);
