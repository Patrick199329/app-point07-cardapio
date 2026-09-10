# Notas Técnicas — Point07

## Stack
Next.js + Supabase (Postgres) + Vercel, padrão Innovation. **Desenvolvimento e validação funcional acontecem primeiro em ambiente local** (Supabase local via CLI) — Supabase Cloud e Vercel entram somente na Fase 6 do backlog (`03-backlog-de-tarefas.md`).

O que é específico deste projeto e deve influenciar decisões técnicas ao longo do desenvolvimento:
- **Realtime é essencial, não opcional.** O Módulo 3 (fila de chamados) só cumpre a promessa feita ao cliente ("chamado em tempo real") se a atualização da fila para os garçons for efetivamente instantânea, sem depender de polling manual ou de o garçom recarregar a tela.
- **Upload de imagem com conversão automática para WebP** é regra de negócio do Módulo 1 (não só otimização técnica) — o cliente reclama do cardápio atual em WordPress justamente pela lentidão/inconsistência de imagens.
- **Geração de QR code é interna à plataforma**, uma por mesa — não depende de serviço externo pago nem de portal de terceiros.
- **Uso concorrente pesado em horário de pico** (sexta/sábado à noite, bar cheio) — tanto no Cardápio Público (vários clientes de salão acessando ao mesmo tempo) quanto no Módulo 3 (vários chamados podem chegar em rajada).

## Integrações necessárias
Não se aplica a este projeto. O contrato assinado exclui expressamente integração com PDV/comanda, pagamento online e notificação por push do sistema operacional ou WhatsApp (ver `00-contexto-e-escopo.md`, "Fora de escopo"). Não há, portanto, nenhuma integração externa a construir — a notificação ao garçom (Módulo 3) é resolvida inteiramente dentro da própria plataforma.

## Requisitos não-funcionais
- **Performance**: o sistema precisa se comportar bem sob pico concentrado (sexta/sábado à noite), não sob carga constante — picos e vales bem marcados. Priorizar resposta rápida da fila de chamados (Módulo 3) mesmo com múltiplos chamados simultâneos.
- **Dados sensíveis / LGPD**: o projeto não trata dados pessoais sensíveis. O cliente do salão não se cadastra (sem nome, e-mail, telefone ou CPF coletado). Os únicos dados pessoais envolvidos são os dos usuários internos (nome e credencial de Administrador/Garçom) — volume baixo, tratamento padrão.
- **Backup e disponibilidade**: nenhuma condição especial foi prometida a este cliente além do padrão Innovation (infraestrutura em nuvem global via Supabase/Vercel, sem os travamentos típicos de hospedagem compartilhada). Não usar termos absolutos ("nunca cai") em qualquer comunicação com o cliente sobre isso.

## Restrições explícitas
- Não pode depender de aplicativo mobile nativo — toda a plataforma é responsiva via navegador (cardápio, chamada de garçom, painel).
- Não pode incluir fluxo de pedido/carrinho, controle de esgotado, horário de funcionamento ou delivery — o cardápio público é somente para consulta.
- Não pode incluir integração com PDV/comanda nem pagamento online.
- Não pode usar push do sistema operacional nem WhatsApp como canal de notificação ao garçom — a notificação do Módulo 3 é obrigatoriamente uma tela/fila dentro da própria plataforma. ⚠️ Nota para quem for desenvolver: o Anexo I do contrato assinado tem uma linha herdada de um template de outro cliente que lista essa exclusão de forma um pouco confusa, mas o Módulo 3 (chamada de garçom em tempo real, dentro da plataforma) está confirmado dentro do escopo — a exclusão é só do canal externo (push do SO / WhatsApp), não da funcionalidade de chamada em si. Patrick está ciente da imprecisão de redação e optou por não alterar o contrato já assinado; o comportamento correto a implementar é o descrito na especificação funcional (`01-especificacao-funcional.md`, Módulo 3).
- Não desenhar aplicativo separado para o cliente do salão — ele não tem conta nem app, só acessa a página pública via QR/link.

## Fora deste documento
Este documento não inclui desenho de schema de banco de dados nem DDL — essa etapa acontece durante o desenvolvimento real no Antigravity, com base na especificação funcional (`01-especificacao-funcional.md`).
