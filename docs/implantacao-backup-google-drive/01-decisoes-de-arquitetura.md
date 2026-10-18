# Decisões de arquitetura — por que cada coisa é do jeito que é

## 1. O backup NÃO roda dentro do Next.js

**Decisão**: a rotina de backup roda no GitHub Actions, nunca como uma Server
Action ou Route Handler da aplicação principal.

**Por quê**: gerar um backup de verdade (dump de banco, download de todos os
arquivos de Storage, upload pro Drive) demora minutos e precisa do binário
`pg_dump`. Hospedagens serverless (Vercel, Netlify etc.) não garantem nem
tempo de execução suficiente, nem têm esse binário disponível. GitHub Actions
roda numa VM Ubuntu completa, de graça, com cron nativo (`on: schedule`) e
disparo manual via API (`workflow_dispatch`) — ideal pra isso.

## 2. Três arquivos de dump separados, não um só

**Decisão**: o backup gera `banco-public.sql` (schema completo + dados),
`banco-auth.sql` (só dados) e `banco-storage.sql` (só dados), em vez de um
`pg_dump` único de tudo.

**Por quê**: `auth` e `storage` são schemas **gerenciados pela própria
plataforma** (Supabase) — qualquer projeto novo já nasce com essas tabelas
criadas. Se o dump incluir `CREATE TABLE` pra essas também, a restauração
falha ("relation already exists"). Então:
- `public` (as tabelas da sua aplicação): dump **completo**, porque esse
  schema não existe ainda num projeto novo — precisa ser recriado do zero.
- `auth` e `storage`: dump **só de dados** (`--data-only`), porque a
  estrutura já vem pronta.

## 3. Algumas tabelas de `auth`/`storage` são excluídas do dump

**Decisão**: `--exclude-table=auth.schema_migrations`,
`--exclude-table=auth.audit_log_entries`, `--exclude-table=auth.flow_state` e
`--exclude-table=storage.migrations`.

**Por quê** (descoberto testando a restauração, não antes): essas são
tabelas de controle **interno** do serviço de autenticação/storage do
Supabase (GoTrue). Mesmo o usuário `postgres` não tem permissão de escrever
nelas num projeto novo — a restauração falha com "permission denied for
table schema_migrations". E não fazem falta: o que importa pra restaurar
quem pode logar são `auth.users`, `auth.identities` etc., que continuam no
dump normalmente.

## 4. `--inserts` no `pg_dump`, não o formato padrão

**Decisão**: todo `pg_dump` roda com a flag `--inserts`.

**Por quê**: o formato padrão do `pg_dump` usa `COPY ... FROM stdin`, que é
um protocolo **exclusivo do cliente `psql`** — um client de Postgres comum
(como a biblioteca `pg` do Node, usada no script de restauração) não
consegue interpretar isso, e falha com erro de sintaxe. `--inserts` troca
por `INSERT INTO ... VALUES (...)` normal, que qualquer client executa.
Hospedagens sem `psql` instalado (ex.: a própria máquina de quem for
restaurar, numa emergência) continuam funcionando.

Efeito colateral do dump recente do `pg_dump` (versão 17+): ele também
insere duas linhas `\restrict <token>` / `\unrestrict <token>` no início e
fim do arquivo — também comandos exclusivos do `psql`, não SQL. O script de
restauração filtra essas duas linhas antes de executar.

## 5. Conexão com o banco via connection pooler, não a conexão direta

**Decisão**: a variável usada pro `pg_dump` (`SUPABASE_DB_URL`/
`RESTORE_DB_URL`) é sempre a **connection string do pooler** (Session
pooler), nunca o host direto (`db.<ref>.supabase.co`).

**Por quê**: em projetos Supabase relativamente novos, o host de conexão
direta só resolve em **IPv6**. Ambientes de CI como o GitHub Actions
normalmente só têm conectividade IPv4 — a conexão falha com "Network is
unreachable". O pooler regional (formato
`aws-N-<regiao>.pooler.supabase.com`) tem IPv4 de verdade.

Dois detalhes que custaram tempo até acertar:
- O usuário muda de formato no pooler: não é `postgres`, é
  `postgres.<referencia-do-projeto>` (o pooler é multi-tenant e precisa
  saber pra qual projeto rotear).
- O número depois de `aws-` (`aws-0-...`, `aws-1-...` etc.) **varia por
  projeto** — não dá pra adivinhar. Sempre pegar o valor exato mostrado em
  **Project → Connect → Direct connection → Session pooler** do próprio
  painel do Supabase daquele projeto.

## 6. `pg_dump`/`psql` precisam ser instalados manualmente no workflow, na versão certa

**Decisão**: o workflow instala `postgresql-client-17` via o repositório
oficial do PostgreSQL (`apt.postgresql.org`), em vez de usar
`apt-get install postgresql-client` (que no Ubuntu do runner só tem a versão
16).

**Por quê**: `pg_dump` recusa fazer dump de um servidor com versão **mais
nova** que a dele (erro "aborting because of server version mismatch"). O
Supabase roda Postgres 17; o pacote padrão do Ubuntu só tem o 16. E depois de
instalar o 17 via PGDG, é preciso também colocar
`/usr/lib/postgresql/17/bin` **na frente** do `PATH` (`echo ... >>
"$GITHUB_PATH"`) — a imagem do runner já vem com o `pg_dump` 16 em
`/usr/bin`, que continua tendo prioridade senão.

## 7. Upload pro Drive via OAuth do usuário, não conta de serviço

**Decisão**: o backup sobe os arquivos usando um **refresh token OAuth da
conta pessoal** do dono do Drive, não uma Service Account do Google Cloud.

**Por quê** (primeira tentativa que não funcionou): contas de serviço do
Google **não têm cota de armazenamento própria** em Drive pessoal — só
funcionam escrevendo em "Shared Drives", que é um recurso exclusivo do
Google Workspace pago. Numa conta Gmail pessoal/gratuita, qualquer upload
feito por uma Service Account falha com "Service Accounts do not have
storage quota". A solução é autenticar como a pessoa de verdade (OAuth2 +
refresh token), fazendo o arquivo usar o espaço dela.

## 8. O token de 7 dias, e por que não tentamos eliminá-lo com verificação do Google

**Contexto**: enquanto a tela de consentimento OAuth do Google estiver em
modo **"Testing"** (o padrão pra um app novo, antes de publicar), todo
refresh token emitido expira em **7 dias** — regra do próprio Google,
independente do escopo usado.

**Opção descartada**: publicar o app formalmente. Isso exige completar
"Branding" (nome, e-mail de suporte, **e se tiver logo, obrigatoriamente
URLs de política de privacidade/termos de serviço e domínio verificado no
Google Search Console**) e, dependendo do escopo, passar pela revisão de
segurança do Google — processo desproporcional pra uma automação de uso
pessoal/interno. Foi tentado e abandonado por causa da complexidade (ver
`02-passo-a-passo-google-cloud.md` pros detalhes de cada erro encontrado
nessa tentativa).

**Decisão final**: manter o app em modo Testing (simples, sem verificação) e
construir um **botão de reautorização dentro do próprio app** — a pessoa
clica, autoriza em 2 cliques (ela já está logada no navegador), e a
aplicação salva o novo refresh token sozinha no banco. Não elimina a
necessidade de renovar a cada ~7 dias, mas reduz de "um processo de 6 passos
manuais no OAuth Playground" pra "um clique".

**Variação possível**: se o projeto alvo tiver acesso a uma conta Google
Workspace (não pessoal), o tipo de usuário "Internal" na tela de
consentimento elimina esse limite de 7 dias sem precisar de verificação
nenhuma — mas só está disponível pra contas gerenciadas por uma organização
Workspace, não pra Gmail pessoal.

## 9. Onde o refresh token fica guardado

**Decisão**: o refresh token vive numa tabela do próprio banco
(`integracao_google_drive`), não como secret fixo do GitHub.

**Por quê**: se ficasse só num secret do GitHub, renovar o token exigiria
sempre entrar no GitHub e editar o secret manualmente. Guardando no banco,
o botão "Autorizar Google Drive" dentro do app escreve ali diretamente — a
rotina de backup (que roda no GitHub Actions) só **lê** o valor mais
recente a cada execução, via a service_role key (que essa sim continua
sendo um secret do GitHub, mas não precisa mudar nunca).

## 10. O "terceiro nível de admin"

**Contexto**: esse mecanismo (backup, e potencialmente outras ferramentas
internas de quem desenvolve a plataforma) não deve aparecer pra admins do
cliente final, mesmo que tecnicamente tenham a role "admin" dentro do
sistema.

**Decisão**: um flag booleano adicional no perfil (`eh_admin_<algo>`,
exemplo usado aqui: `eh_admin_innovation` — troque pelo nome que fizer
sentido no seu contexto), **travado no nível de coluna do banco**: o grant
de `UPDATE` pra usuários autenticados cobre só as colunas que a aplicação
realmente edita (nome, e-mail, role, status) — a coluna desse flag fica de
fora do grant, então nenhum admin consegue setar isso em si mesmo nem
chamando a API diretamente com a própria sessão, só via acesso direto ao
banco (SQL/service_role). Ver `03-banco-de-dados.sql` pro SQL exato — essa
técnica (GRANT por coluna, não só RLS por linha) é reaproveitável pra
qualquer outro campo que precise dessa mesma garantia de "nem o próprio
dono da conta consegue mudar isso sozinho".
