#!/usr/bin/env node
/**
 * Restaura um backup diário de PRODUÇÃO (pasta baixada do Google Drive) no banco e no
 * storage LOCAIS do Docker (Supabase local do Point07). NÃO toca na produção: lê só os
 * arquivos da pasta e escreve só no Docker local.
 *
 * Uso:   node scripts/restaurar-producao-local.mjs "<pasta-do-backup>" --sim
 *
 * Trava de segurança — aborta se:
 *   - faltar o `--sim` (o banco local é ZERADO e recarregado);
 *   - NEXT_PUBLIC_SUPABASE_URL (.env.local) não apontar pra localhost/127.0.0.1;
 *   - o container `supabase_db_point07` não existir.
 *
 * O que NÃO é copiado (sensível): token do Google Drive (integracao_google_drive),
 * inscrições de push dos celulares reais (push_inscricoes — senão o local poderia disparar
 * notificação pra garçom de verdade), histórico de backups e SENHAS/tokens de login. Os
 * usuários são recriados a partir de `profiles` (mesmo id/e-mail/nome/perfil) com a senha
 * de desenvolvimento `point07dev`.
 *
 * A pasta do backup tem dados reais: mantenha fora do git (/Local/ está no .gitignore).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const DB = "supabase_db_point07";
const TMP = "backup_tmp";
const SENHA_DEV = "point07dev";
/** Tabelas de `public` que viram cópia da produção. */
const TABELAS = [
  "avisos", "cardapio_config", "cardapio_publicado", "cardapio_rascunho_status", "categorias",
  "chamados", "fila_config", "logs_auditoria", "mesas", "produto_grupos_opcoes",
  "produto_opcoes", "produtos", "profiles", "qr_universal", "sistema_config",
];

function falha(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

// ----------------------------------------------------------------- argumentos e travas
const args = process.argv.slice(2);
const confirmado = args.includes("--sim");
const pastaArg = args.find((a) => !a.startsWith("--"));
if (!pastaArg) falha('Informe a pasta do backup: node scripts/restaurar-producao-local.mjs "<pasta>" --sim');
const pasta = resolve(pastaArg);
if (!existsSync(join(pasta, "banco-public.sql"))) falha(`banco-public.sql não encontrado em ${pasta}`);

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const urlSupabase = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const host = (() => { try { return new URL(urlSupabase).hostname; } catch { return ""; } })();
if (!["127.0.0.1", "localhost"].includes(host)) {
  falha(`NEXT_PUBLIC_SUPABASE_URL (${urlSupabase || "vazia"}) não é local. Abortando para proteger a produção.`);
}
const chaveServico = env.SUPABASE_SERVICE_ROLE_KEY;
if (!chaveServico) falha("SUPABASE_SERVICE_ROLE_KEY ausente no .env.local");

function docker(argsDocker, { input, maxBuffer = 512 * 1024 * 1024, ok = false } = {}) {
  const r = spawnSync("docker", argsDocker, { input, maxBuffer, encoding: "utf8" });
  if (!ok && r.status !== 0) falha(`docker ${argsDocker.slice(0, 5).join(" ")}…\n${r.stderr || r.error}`);
  return r;
}
const psql = (db, sql, { stopOnError = true, ok = false } = {}) =>
  docker(
    ["exec", "-i", DB, "psql", "-U", "postgres", "-d", db, "-q", "-v", `ON_ERROR_STOP=${stopOnError ? 1 : 0}`],
    { input: sql, ok },
  );
const consulta = (db, sql) =>
  docker(["exec", DB, "psql", "-U", "postgres", "-d", db, "-tA", "-F", "\t", "-c", sql]).stdout.trim();

if (docker(["inspect", DB], { ok: true }).status !== 0) falha(`Container ${DB} não encontrado (o Supabase local está de pé? npm run db:start)`);

console.log(`Backup:  ${pasta}`);
console.log(`Destino: ${urlSupabase} (Docker local)`);
if (!confirmado) {
  console.log("\nIsto vai ZERAR o banco local e recarregar com os dados do backup.");
  console.log("Rode de novo com --sim para confirmar.");
  process.exit(0);
}

// ----------------------------------------------------------------- 1) schema limpo
console.log("\n[1/6] Recriando o banco local (npm run db:reset)…");
const reset = spawnSync("npm", ["run", "db:reset"], { shell: true, stdio: "inherit" });
if (reset.status !== 0) falha("db:reset falhou");

// ----------------------------------------------------------------- 2) dump em banco temporário
console.log("\n[2/6] Lendo o backup num banco temporário…");
psql("postgres", `drop database if exists ${TMP};`);
psql("postgres", `create database ${TMP};`);
// O dump recria `public` e referencia auth.users / auth.uid(): cria um auth mínimo só pra ele carregar.
psql(TMP, `
  drop schema public cascade;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
`);
const sqlPublic = readFileSync(join(pasta, "banco-public.sql"), "utf8")
  .split(/\r?\n/)
  .filter((l) => !/^\\(un)?restrict\b/.test(l)) // comandos exclusivos do psql que o pg_dump novo insere
  .join("\n");
psql(TMP, sqlPublic, { stopOnError: false, ok: true }); // erros esperados: publication/realtime, RLS de auth

const esperado = {};
for (const t of TABELAS) {
  esperado[t] = (sqlPublic.match(new RegExp(`^INSERT INTO public\\.${t} `, "gm")) ?? []).length;
}
for (const t of TABELAS) {
  const n = Number(consulta(TMP, `select count(*) from public.${t}`));
  if (n !== esperado[t]) falha(`Tabela ${t}: ${n} linhas no banco temporário, o backup tem ${esperado[t]} INSERTs`);
}

// ----------------------------------------------------------------- 3) usuários locais
console.log("\n[3/6] Recriando os usuários locais (senha de desenvolvimento)…");
const q = (s) => `'${String(s ?? "").replace(/'/g, "''")}'`;
const perfis = consulta(TMP, "select id, email, coalesce(nome, ''), role::text from public.profiles")
  .split("\n")
  .filter(Boolean)
  .map((l) => l.split("\t"));
const linhasUsuarios = perfis
  .map(([id, email, nome, role]) => `('00000000-0000-0000-0000-000000000000', ${q(id)}, 'authenticated', 'authenticated',
     ${q(email)}, extensions.crypt(${q(SENHA_DEV)}, extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', ${q(JSON.stringify({ nome, role }))}, now(), now(), '', '', '', '')`)
  .join(",\n");
const linhasIdent = perfis
  .map(([id, email]) => `(gen_random_uuid(), ${q(id)}, ${q(id)}, ${q(JSON.stringify({ sub: id, email }))}::jsonb, 'email', now(), now(), now())`)
  .join(",\n");
psql("postgres", `
  -- Chamados de exemplo primeiro: apagar os usuários de exemplo "desligaria" o garçom deles
  -- (on delete set null) e a regra chamados_finalizado_consistente barra isso.
  delete from public.chamados;
  delete from auth.users;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ${linhasUsuarios};
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values ${linhasIdent};
`);

// ----------------------------------------------------------------- 4) dados
console.log("\n[4/6] Carregando os dados da produção no banco local…");
const dump = docker([
  "exec", DB, "pg_dump", "-U", "postgres", "-d", TMP,
  "--data-only", "--column-inserts", "--no-owner", "--no-privileges",
  ...TABELAS.flatMap((t) => ["-t", `public.${t}`]),
]).stdout
  .split(/\r?\n/)
  .filter((l) => !/^\\(un)?restrict\b/.test(l))
  .join("\n");
psql("postgres", `
  begin;
  set local session_replication_role = replica;  -- sem triggers (auditoria, updated_at) nem FKs durante a carga
  ${TABELAS.map((t) => `delete from public.${t};`).join("\n  ")}
  ${dump}
  commit;
`);
for (const t of TABELAS) {
  const n = Number(consulta("postgres", `select count(*) from public.${t}`));
  if (n !== esperado[t]) falha(`Tabela ${t}: ${n} linhas no banco local, esperado ${esperado[t]}`);
}
psql("postgres", `drop database ${TMP};`);

// ----------------------------------------------------------------- 5) storage
console.log("\n[5/6] Enviando as imagens ao storage local…");
// O storage-api local (v1.72) apaga o índice único que ele mesmo exige pra gravar (erro 42P10): recria.
docker(["exec", "-e", "PGPASSWORD=postgres", DB, "psql", "-h", "127.0.0.1", "-U", "supabase_storage_admin", "-d", "postgres", "-qtA",
  "-c", "create unique index if not exists bucketid_objname on storage.objects (bucket_id, name)"]);
const raizArquivos = join(pasta, "arquivos");
const arquivos = [];
(function varrer(dir) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) varrer(p);
    else arquivos.push(p);
  }
})(raizArquivos);
const TIPOS = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".gif": "image/gif" };
let enviados = 0;
const erros = [];
async function enviar(p) {
  const caminho = relative(raizArquivos, p).split("\\").join("/"); // "cardapio/produtos/x.webp"
  const res = await fetch(`${urlSupabase}/storage/v1/object/${caminho}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${chaveServico}`,
      "Content-Type": TIPOS[extname(p).toLowerCase()] ?? "application/octet-stream",
      "x-upsert": "true",
    },
    body: readFileSync(p),
  });
  if (res.ok) enviados++; else erros.push(`${caminho}: ${res.status} ${await res.text()}`);
}
const fila = [...arquivos];
await Promise.all(Array.from({ length: 6 }, async () => { for (let p; (p = fila.pop()); ) await enviar(p); }));
if (erros.length) console.warn(`⚠ ${erros.length} arquivo(s) com erro:\n  ${erros.slice(0, 5).join("\n  ")}`);

// ----------------------------------------------------------------- 6) resumo
console.log("\n[6/6] Pronto.");
console.log(`  Tabelas carregadas: ${TABELAS.length} · imagens: ${enviados}/${arquivos.length}`);
console.log(`  Usuários locais: ${perfis.length} (mesmos e-mails da produção). Senha de TODOS: ${SENHA_DEV}`);
console.log("  NÃO restaurado de propósito: token do Google Drive, inscrições de push, histórico de backups, senhas reais.");
