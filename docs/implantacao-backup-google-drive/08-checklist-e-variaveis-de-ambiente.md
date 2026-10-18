# Checklist final e variáveis de ambiente

## Checklist, em ordem

- [ ] Aplicar as 3 migrations de `03-banco-de-dados.sql` (ajustadas pro
      schema do projeto alvo).
- [ ] Marcar manualmente a primeira conta como admin interno (comentário no
      final da migration 1 — não existe, de propósito, nenhuma tela pra
      isso).
- [ ] Criar `scripts/backup-diario.mjs` e `scripts/restaurar-backup.mjs` no
      projeto (copiados da pasta `scripts/` desta documentação).
- [ ] Seguir `02-passo-a-passo-google-cloud.md`: projeto no Google Cloud,
      Drive API habilitada, tela de consentimento em modo Testing com o(s)
      e-mail(s) certo(s) em "Test users", OAuth Client ID **tipo "Web
      application"** com os dois redirect URIs.
- [ ] Pegar o ID da pasta do Drive de destino.
- [ ] Criar `.github/workflows/backup-diario.yml` (copiado de
      `06-github-actions-backup-diario.yml` desta documentação, com a versão
      do Postgres ajustada se necessário).
- [ ] Cadastrar os secrets do repositório no GitHub (tabela abaixo).
- [ ] Implementar as rotas e a tela de `07-frontend-nextjs.md`.
- [ ] Cadastrar as variáveis de ambiente da aplicação (Vercel ou outra
      hospedagem — tabela abaixo).
- [ ] Testar o botão "Autorizar Google Drive" uma vez, de ponta a ponta.
- [ ] Disparar um backup manual e conferir que o arquivo aparece no Drive e
      o registro aparece na tela.
- [ ] **Testar uma restauração completa** contra um projeto Supabase novo e
      descartável — é nessa hora que aparecem os bugs reais de formato de
      dump (ver decisões 2, 3 e 4 em `01-decisoes-de-arquitetura.md`), nunca
      só rodando o backup.
- [ ] Apagar o projeto de teste usado na restauração depois de validado (ele
      fica com uma cópia completa dos dados reais).

## Nota sobre reexecutar o teste de restauração

Se for repetir o teste de restauração contra o **mesmo** projeto de teste
(em vez de criar um novo a cada vez), é preciso **limpar os dados da
tentativa anterior** antes, senão a segunda tentativa falha com erro de
chave duplicada:

```sql
truncate auth.users, storage.objects, storage.buckets cascade;
-- e, se o public.sql já tiver rodado também:
drop schema public cascade; create schema public;
```

(Mais simples e mais fiel ao cenário real: só criar um projeto Supabase novo
a cada teste, e descartar depois.)

## Variáveis de ambiente — onde cada uma vai

| Variável | Onde | Pra que serve |
|---|---|---|
| `SUPABASE_DB_URL` | Secret do repositório (GitHub) | Connection string do **pooler** (não o host direto — ver decisão 5), usada pelo `pg_dump` |
| `SUPABASE_URL` | Secret do repositório (GitHub) | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret do repositório (GitHub) **e** variável de ambiente da aplicação | A rotina usa pra gravar `backup_logs`/ler `integracao_google_drive`; a aplicação usa em outros contextos que já existem no projeto |
| `GOOGLE_CLIENT_ID` | Secret do repositório (GitHub) **e** variável de ambiente da aplicação | Precisa nos dois lados: o workflow usa pra autenticar o upload, a aplicação usa pra montar a URL de autorização e trocar o código no callback |
| `GOOGLE_CLIENT_SECRET` | Secret do repositório (GitHub) **e** variável de ambiente da aplicação | Mesmo motivo acima |
| `GOOGLE_DRIVE_FOLDER_ID` | Secret do repositório (GitHub) | Pasta de destino dos backups |
| `GITHUB_PAT` | Variável de ambiente da aplicação (não vai pro GitHub) | Pro botão "Rodar backup agora" disparar o workflow via API |
| `GITHUB_REPO` | Variável de ambiente da aplicação | Formato `dono/repositorio`, usado pelo mesmo botão |
| `BACKUP_RETENCAO_DIAS` | Opcional, secret ou variável direta no workflow | Quantos dias manter backups antigos no Drive (padrão 30) |

**Não existe** nenhum secret `GOOGLE_REFRESH_TOKEN` fixo — o token fica na
tabela `integracao_google_drive` e é renovado pelo botão dentro do app (ver
decisão 9 em `01-decisoes-de-arquitetura.md`). Se a implantação alvo decidir
**não** construir o frontend (só rodar o backup por enquanto), é possível
gerar um token manualmente via OAuth Playground (passo 4 de
`02-passo-a-passo-google-cloud.md`) e inserir direto na tabela — só que aí
ele expira em ~7 dias sem o botão pra renovar.

## Variáveis só do script de restauração (uso local/manual, nunca em CI)

| Variável | Pra que serve |
|---|---|
| `RESTORE_ZIP` | Caminho local do `.zip` baixado do Drive |
| `RESTORE_DB_URL` | Connection string do pooler do projeto **de destino** da restauração |
| `RESTORE_SUPABASE_URL` | URL do projeto de destino |
| `RESTORE_SERVICE_ROLE_KEY` | Service role key do projeto de destino |
