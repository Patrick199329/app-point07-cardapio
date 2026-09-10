# Backlog de Tarefas — Point07

Tarefas ordenadas por dependência técnica, agrupadas em fases. Todo o desenvolvimento e validação funcional das Fases 1 a 5 acontece em ambiente local (Supabase local via CLI) — nenhuma dependência de Supabase Cloud ou Vercel antes da Fase 6.

## Fase 1 — Fundação (local)

### Fase 1 — Estrutura de usuários e perfis de acesso
- **Descrição**: implementar autenticação com login individual e os dois perfis internos do projeto (Administrador, Garçom), conforme Módulo 6.
- **Depende de**: nenhuma.
- **Critério de aceite**: é possível criar um usuário Administrador e um ou mais usuários Garçom, cada um com login próprio, e o sistema distingue as permissões dos dois perfis.

### Fase 1 — Estrutura de dados de mesas
- **Descrição**: cadastro básico de mesas (identificador único por mesa), base para o Módulo 3 (QR por mesa) e o Módulo 4 (registro de eventos por mesa).
- **Depende de**: Fase 1 — Estrutura de usuários e perfis de acesso (para restringir o cadastro ao perfil Administrador).
- **Critério de aceite**: o Administrador consegue cadastrar, editar e desativar mesas individualmente.

## Fase 2 — Fluxos principais (local)

### Fase 2 — Gestão de Cardápio (Módulo 1)
- **Descrição**: painel administrativo de categorias e produtos, com templates prontos, reordenação, ativação/inativação, e upload de imagem com conversão automática para WebP.
- **Depende de**: Fase 1 — Estrutura de usuários e perfis de acesso.
- **Critério de aceite**: o Administrador cria uma categoria nova e um produto novo sem precisar montar layout do zero; a imagem enviada é convertida para WebP automaticamente; reordenar categorias/produtos reflete na ordem de exibição.

### Fase 2 — Preparação da migração do cardápio (WordPress → nova plataforma)
- **Descrição**: extrair e estruturar os dados do cardápio atual em WordPress (~15 categorias, ~130 itens, preços entre R$ 5,50 e R$ 219,00 — ver `clientes/point07-migracao-analise.md`) num formato pronto para importar na Gestão de Cardápio, e validar a importação em ambiente local.
- **Depende de**: Fase 2 — Gestão de Cardápio (Módulo 1).
- **Critério de aceite**: todas as categorias e itens do cardápio atual estão importados corretamente em ambiente local (nome, descrição, preço, categoria, imagem), sem itens perdidos ou preços incorretos. A carga definitiva em produção acontece na Fase 7.

### Fase 2 — Cardápio Público (Módulo 2)
- **Descrição**: página pública, mobile-first, que reflete em tempo real o que está configurado na Gestão de Cardápio, sem exigir cadastro/login, com botão "Chamar garçom".
- **Depende de**: Fase 2 — Gestão de Cardápio (Módulo 1).
- **Critério de aceite**: uma alteração feita na Gestão de Cardápio aparece na página pública sem publicação manual separada; a página é usável em celular (iOS e Android) sem os bugs de exibição do cardápio atual.

### Fase 2 — Chamada de Garçom (Módulo 3)
- **Descrição**: geração interna de QR code por mesa; fila de chamados em tempo real para os garçons, em ordem de chegada; aceite exclusivo (o primeiro garçom a aceitar "leva" o chamado, e ele desaparece/muda de status para os demais).
- **Depende de**: Fase 1 — Estrutura de dados de mesas; Fase 1 — Estrutura de usuários e perfis de acesso; Fase 2 — Cardápio Público (para o botão "Chamar garçom").
- **Critério de aceite**: um chamado feito a partir do QR de uma mesa aparece instantaneamente na fila de todos os garçons logados; quando um garçom aceita, o chamado sai da fila (ou muda de status) para os demais, mesmo em caso de dois garçons tentando aceitar quase simultaneamente — só um deles deve conseguir.

### Fase 2 — Registro de Eventos (Módulo 4)
- **Descrição**: gravação automática de todo chamado do Módulo 3 (mesa, horário da solicitação, horário do aceite, garçom responsável), inclusive chamados nunca aceitos.
- **Depende de**: Fase 2 — Chamada de Garçom (Módulo 3).
- **Critério de aceite**: todo chamado gerado no Módulo 3 aparece no histórico, com os dados corretos; um chamado nunca aceito também é registrado (sem horário de aceite/garçom).

## Fase 3 — Painel administrativo (local)

### Fase 3 — Painel Gerencial (Módulo 5)
- **Descrição**: dashboard para o Administrador com os indicadores mínimos definidos na especificação: tempo médio entre chamado e atendimento, mesas com maior tempo de espera, atendimentos por garçom e por dia, filtros e relatórios visuais.
- **Depende de**: Fase 2 — Registro de Eventos (Módulo 4).
- **Critério de aceite**: o Administrador consegue visualizar os quatro indicadores mínimos e filtrar por garçom, por dia e por mesa; o painel sinaliza visualmente quando o volume de dados do período é baixo demais para uma leitura confiável de desempenho.

### Fase 3 — Cadastro de usuários e mesas (telas administrativas)
- **Descrição**: telas de gestão para o Administrador cadastrar/editar/desativar usuários (Módulo 6) e mesas (Fase 1) via interface, não só via banco.
- **Depende de**: Fase 1 — Estrutura de usuários e perfis de acesso; Fase 1 — Estrutura de dados de mesas.
- **Critério de aceite**: o Administrador realiza toda a gestão de usuários e mesas pela interface, sem necessidade de acesso direto ao banco de dados.

## Fase 4 — Integrações (local, com mocks quando necessário)
Não se aplica a este projeto. O contrato assinado não inclui nenhuma integração externa (PDV/comanda, pagamento online, push do sistema operacional ou WhatsApp estão expressamente fora de escopo — ver `00-contexto-e-escopo.md` e `02-notas-tecnicas.md`).

## Fase 5 — Validação local completa

### Fase 5 — Checkpoint de validação funcional local
- **Descrição**: revisar todo o escopo aprovado (Módulos 1 a 6) rodando localmente, incluindo o cardápio migrado (dados reais de teste), sem pendências abertas de funcionalidade.
- **Depende de**: todas as tarefas das Fases 1 a 3.
- **Critério de aceite**: todos os módulos do escopo aprovado funcionam de ponta a ponta em ambiente local, incluindo o fluxo completo cliente-do-salão → chamado → aceite → registro → painel gerencial, antes de qualquer provisionamento de infraestrutura de produção.

## Fase 6 — Deploy em nuvem (Supabase + Vercel)

### Fase 6 — Provisionamento de produção
- **Descrição**: provisionar o projeto Supabase de produção, migrar o schema já validado localmente, configurar o deploy na Vercel e as variáveis de ambiente.
- **Depende de**: Fase 5 — Checkpoint de validação funcional local.
- **Critério de aceite**: a plataforma está publicada em ambiente de produção (Supabase + Vercel), funcionalmente equivalente ao ambiente local validado.

### Fase 6 — Domínio próprio do cliente
- **Descrição**: configurar domínio próprio do cliente (substituindo o subdomínio atual `point07.innovationconsultoria.com.br`), conforme escopo aprovado e princípio de pertencimento da Innovation.
- **Depende de**: Fase 6 — Provisionamento de produção.
- **Critério de aceite**: a plataforma responde no domínio próprio do cliente, com o subdomínio antigo redirecionando ou desativado conforme combinado.
- **⚠️ Pendência**: depende de definição do domínio a ser usado (não confirmado ainda com o cliente — ver `00-contexto-e-escopo.md`).

## Fase 7 — Testes finais e entrega

### Fase 7 — Migração definitiva dos dados do cardápio
- **Descrição**: carregar em produção os dados reais e completos do cardápio atual (todas as ~15 categorias e ~130 itens), substituindo os dados de teste usados na validação local.
- **Depende de**: Fase 2 — Preparação da migração do cardápio; Fase 6 — Provisionamento de produção.
- **Critério de aceite**: o cardápio em produção reflete 100% dos itens e preços atualmente publicados no WordPress, conferido item a item.

### Fase 7 — Geração dos QR codes físicos por mesa
- **Descrição**: gerar e disponibilizar para impressão o QR code de cada mesa cadastrada, já apontando para a plataforma em produção.
- **Depende de**: Fase 6 — Domínio próprio do cliente; Fase 7 — Migração definitiva dos dados do cardápio.
- **Critério de aceite**: cada mesa tem um QR code funcional, testado fisicamente, apontando para o cardápio público e o fluxo de chamada de garçom em produção.
- **⚠️ Pendência**: depende do número final de mesas confirmado com o cliente (ver `00-contexto-e-escopo.md`).

### Fase 7 — Treinamento e checklist de entrega
- **Descrição**: treinar Aquiles e a equipe (Administrador e Garçons) no uso da plataforma; aplicar o checklist padrão de entrega da Innovation (backup automatizado, credenciais de acesso, domínio configurado) já em ambiente de produção.
- **Depende de**: Fase 7 — Migração definitiva dos dados do cardápio; Fase 7 — Geração dos QR codes físicos por mesa.
- **Critério de aceite**: Administrador e Garçons demonstram uso correto da plataforma; checklist padrão de entrega da Innovation totalmente concluído; Aceite Formal assinado pelo cliente, respeitando o prazo contratual de até 30 dias úteis (Cláusula Terceira, §4º).
