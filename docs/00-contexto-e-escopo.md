# Contexto e Escopo — Point07

## Cenário do cliente
Point07 (razão social Choperia Trovão Ltda, CNPJ 35.975.109/0001-29) é um bar/restaurante em Mariana/MG, contato Aquiles (proprietário). É cliente legado da Innovation com um cardápio digital simples em WordPress + Elementor, hospedado num subdomínio da própria Innovation. Na reunião de reestruturação, o escopo cresceu de "trocar o WordPress" para uma plataforma que resolve dois processos: a gestão do cardápio (hoje lenta e dependente do Patrick para qualquer mudança) e a coordenação do atendimento de salão (hoje sem registro, sem métrica, dependente da atenção dos garçons). A funcionalidade de maior entusiasmo do cliente — chamada de garçom com registro de tempo e dashboard por atendente — partiu do próprio Aquiles, não da Innovation.

## Pacote contratado
- Modalidade no contrato: **Sob Medida** (marcada no Quadro Resumo Comercial)
- Setup: **R$ 600,00** | Mensalidade: **R$ 160,00/mês**
- Fidelidade mínima: 6 (seis) meses, com cláusula de cobrança das mensalidades remanescentes em caso de cancelamento antecipado
- Sem add-ons contratados
- Prazo até a Entrega (Aceite Formal): **até 30 (trinta) dias úteis** após assinatura + 1ª parcela do setup

⚠️ **Nota de divergência (não ignorar):** os valores acima estão bem abaixo da Tabela Oficial de Preços vigente da Innovation para Sob Medida (piso R$ 6.500 de setup / R$ 397 de mensalidade). Isso não é um erro de precificação — é uma concessão comercial explícita e documentada do Patrick, motivada por potencial de indicação a um grupo de empresários liderado pelo Aquiles. Não usar este contrato como referência de preço para outros clientes.

## Objetivo de negócio da plataforma
Devolver ao Aquiles autonomia sobre o próprio cardápio (hoje qualquer alteração de categoria ou personalização depende de acionar o Patrick) e criar visibilidade gerencial sobre o atendimento de salão, que hoje não tem nenhum registro de tempo de resposta ou desempenho por garçom.

## Escopo aprovado (o que entra)
1. **Gestão de Cardápio** — painel de administração do cardápio (categorias, produtos, imagens)
2. **Cardápio Público** — página pública do cardápio, acessada pelo cliente do salão via QR/link, sem login
3. **Chamada de Garçom** — QR por mesa, fila de chamados em tempo real, aceite exclusivo entre garçons
4. **Registro de Eventos** — histórico de cada chamado (mesa, horário da solicitação, horário do aceite, garçom responsável)
5. **Painel Gerencial** — indicadores de atendimento (tempo médio, atendimentos por garçom/dia, mesas com maior espera)
6. **Usuários e Permissões** — cadastro de usuários internos (Administrador, Garçom) com login individual
7. **Migração completa** do cardápio atual (WordPress) para a nova plataforma
8. **Domínio próprio do cliente**, substituindo o subdomínio atual da Innovation (`point07.innovationconsultoria.com.br`) — alinhado ao princípio de pertencimento da Innovation (dados, domínio e identidade visual são do cliente)

## Fora de escopo (o que explicitamente não entra)
- **Pedido pelo cardápio digital** (fluxo de pedido e carrinho) — o cardápio é somente para consulta; o pedido continua sendo feito presencialmente com o garçom
- **Integração com PDV/sistema de comanda e impressão automática na cozinha** — a operação de cozinha segue o processo atual do cliente
- **Pagamento online pelo cardápio** — o pagamento segue o fluxo presencial já praticado no salão
- **Aplicativo mobile nativo** — toda a plataforma (cardápio, chamada de garçom, painel) é responsiva via navegador
- **Notificação por push do sistema operacional ou por WhatsApp ao garçom** — está expressamente fora do escopo no contrato assinado. Importante: isso NÃO significa que a chamada de garçom em tempo real está fora de escopo — ela está dentro (é o Módulo 3, via tela/fila dedicada dentro da própria plataforma). O que fica de fora é especificamente usar push do SO ou mensageria externa (WhatsApp) como canal de aviso ao garçom.

## Decisões-chave já tomadas
- A entrega ao cliente é única, sem marcos visíveis — mas a construção interna pode seguir a ordem cardápio → salão, por gestão de risco técnico.
- O cliente do salão acessa o cardápio público sem login/cadastro.
- Cada garçom tem login individual; o aceite de um chamado é exclusivo (o primeiro garçom a aceitar "leva" o chamado, evitando duplicidade de atendimento).
- O painel gerencial mede desempenho individual por garçom — decisão de negócio do próprio cliente (ver risco de adoção em `02-notas-tecnicas.md`).
- A migração do cardápio atual envolve aproximadamente 15 categorias e 130 itens (mais de 65 só em bebidas), preços entre R$ 5,50 e R$ 219,00, já com imagens em formato webp — ver diagnóstico completo em `clientes/point07-migracao-analise.md`.
- O cardápio atual não tem carrinho, controle de esgotado, horário de funcionamento nem delivery — nenhum desses recursos foi pedido para esta versão.

## Pendências — ⚠️ A CONFIRMAR COM O CLIENTE
- **Número de mesas** atendidas pelo módulo de chamada de garçom, incluindo área externa (se houver)
- **Número de usuários internos** (Administrador + Garçons)
- **Forma de pagamento do setup** escolhida pelo cliente (50% + 50%, ou 6x sem juros)
- **Dispositivo do garçom**: tela fixa no salão como painel principal, ou celular pessoal do garçom como principal/secundário — relevante porque push em PWA no iOS tem entrega inconsistente quando o app não está aberto
- **Cobertura de Wi-Fi** do salão e da área externa (se houver) — precisa de levantamento antes do go-live
- **Propriedade dos aparelhos** usados pelos garçons (do restaurante ou pessoais)
- **Data-alvo de início do projeto** (kick-off), que define a contagem dos até 30 dias úteis até o Aceite Formal

## Referências
- `CONTRATO_Point07_Innovation.docx` — contrato assinado (set/2026), fonte de verdade para escopo (Anexo I), cronograma contratual (Anexo II) e condições comerciais
- `Proposta_Point07_2.pptx` — proposta com os valores efetivamente acordados com o cliente (setup e mensalidade riscados e corrigidos à mão)
- `clientes/point07-escopo-ampliado-v2.md` — registro de decisão do projeto Innovation, incluindo o racional de precificação, a divergência frente à Tabela Oficial e o histórico de ajustes do contrato
- `clientes/point07-migracao-analise.md` — diagnóstico técnico do cardápio atual em WordPress (categorias, itens, faixa de preços, ausência de domínio próprio)
