# Backup diário + restauração + autorização do Google Drive — guia de implantação

> **Para quem lê isto**: este documento foi escrito pra outro agente de IA (ou
> um desenvolvedor) implantar, do zero, em **outro projeto Next.js + Supabase**,
> o mesmo mecanismo de backup diário descrito aqui. Foi extraído de uma
> implantação real, incluindo todos os erros encontrados no caminho e como
> cada um foi resolvido — não é teoria, é o que de fato funcionou depois de
> testado de ponta a ponta (backup → restauração num projeto novo → dados
> conferidos).
>
> Nenhum identificador real do projeto original (URLs, IDs de projeto, nomes
> de repositório, e-mails, chaves) aparece aqui — só placeholders genéricos,
> marcados em maiúsculas entre `< >`.

## O que este mecanismo entrega

1. **Backup diário automático** do banco (dados + usuários + arquivos),
   rodando fora da aplicação principal, salvo no Google Drive da pessoa
   responsável pelo projeto.
2. **Botão "Rodar backup agora"** dentro do próprio app, pra quem precisar de
   um backup extra sem esperar o horário programado.
3. **Botão de autorização do Google com um clique**, porque o token do Google
   expira a cada ~7 dias enquanto o app OAuth não for formalmente publicado —
   em vez de um processo manual chato, é um clique dentro do próprio painel.
4. **Script de restauração**, testado de verdade, que recria um projeto
   Supabase inteiro (estrutura + dados + usuários + arquivos) a partir de um
   desses backups.
5. **Uma tela dentro do app, visível só pra quem desenvolve a plataforma**
   (não pros admins do cliente final), mostrando o histórico de backups e os
   dois botões acima.

## Por que isso existe (contexto que importa pra decisão de arquitetura)

O projeto de origem está no **plano gratuito do Supabase**, que não inclui
backup automático nativo (isso só existe a partir do plano Pro). A solução
precisou ser construída por fora, sem custo, e precisou sobreviver a vários
obstáculos reais de infraestrutura (detalhados no arquivo 01). Se o projeto
alvo da implantação **já estiver num plano Supabase pago**, vale considerar
usar o backup nativo deles como camada adicional — mas o mecanismo aqui
continua útil como cópia independente, inclusive pra migração de provedor.

## Mapa dos arquivos desta pasta

| Arquivo | O que tem |
|---|---|
| `01-decisoes-de-arquitetura.md` | Por que cada escolha técnica foi feita, e quais alternativas foram tentadas e descartadas (e por quê — importante pra não repetir o mesmo caminho morto) |
| `02-passo-a-passo-google-cloud.md` | Roteiro exato de configuração no Google Cloud Console, incluindo todos os erros que aparecem no caminho |
| `03-banco-de-dados.sql` | As 3 migrations necessárias (flag de admin interno, histórico de backups, integração do Google) |
| `scripts/backup-diario.mjs` | O script que roda todo dia (ou sob demanda) e faz o backup de verdade |
| `scripts/restaurar-backup.mjs` | O script de restauração, testado contra um projeto novo |
| `06-github-actions-backup-diario.yml` | O workflow do GitHub Actions que agenda e dispara o backup |
| `07-frontend-nextjs.md` | As rotas de OAuth e a tela de administração (código completo) |
| `08-checklist-e-variaveis-de-ambiente.md` | Checklist final, em ordem, com a tabela de todas as variáveis de ambiente necessárias e onde cada uma vai |

## Ordem recomendada de implantação

1. Ler `01-decisoes-de-arquitetura.md` por inteiro antes de escrever qualquer
   código — evita redescobrir os mesmos becos sem saída.
2. Aplicar as migrations de `03-banco-de-dados.sql` (adaptando nomes de
   tabela/schema se o projeto alvo já tiver convenções próprias).
3. Criar os dois scripts (`scripts/`) no projeto novo.
4. Seguir `02-passo-a-passo-google-cloud.md` pra configurar o Google Cloud e
   conseguir `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
5. Criar o workflow do GitHub Actions (`06-...yml`).
6. Implementar as rotas e a tela descritas em `07-frontend-nextjs.md`.
7. Seguir o checklist final de `08-...md` pra conferir que nada ficou de fora.
8. **Testar uma restauração de verdade** contra um projeto Supabase novo e
   descartável antes de considerar o mecanismo confiável — foi assim que os
   bugs reais de formato de dump foram encontrados na implantação original,
   e eles só aparecem na hora de restaurar, nunca na hora de só gerar o
   backup.
