# Especificação Funcional — Point07

## Módulo 1 — Gestão de Cardápio
- **Descrição**: painel administrativo onde o Administrador cria, edita e organiza o cardápio (categorias e produtos) sem depender da Innovation para mudanças de rotina.
- **Atores / perfis envolvidos**: Administrador.
- **Regras de negócio**:
  - Categorias e produtos usam templates prontos — criar uma categoria nova não deve exigir montar layout do zero (essa era a principal dor do cliente com o WordPress atual).
  - Categorias e produtos podem ser reordenados (a ordem de exibição no cardápio público reflete a ordem definida aqui).
  - Categorias e produtos podem ser ativados/inativados individualmente, sem precisar excluir o registro.
  - Upload de imagem de produto passa por conversão automática para o formato WebP.
  - O cardápio atual (WordPress) precisa ser migrado por completo: ~15 categorias, ~130 itens, preços entre R$ 5,50 e R$ 219,00.
- **Dados envolvidos**: nome, descrição, preço, categoria, imagem e status (ativo/inativo) de cada produto; nome, ordem de exibição e status de cada categoria.
- **Modelos de produto (templates)**: levantamento do cardápio atual (24 categorias, ~129 itens — ver `clientes/point07-cardapio-atual-categorias.md`) mostra que os itens seguem 4 padrões, que devem orientar os templates prontos do Módulo 1:
  - **Modelo A — Item simples**: nome, descrição opcional, imagem, preço único. Cobre a maioria dos itens (bebidas, espetinhos, pizzas, pães de alho, caldos, medalhões).
  - **Modelo B — Item com tamanhos (Médio/Grande)**: nome, descrição, imagem, dois preços rotulados. Cobre Entradas e Porções.
  - **Modelo C — Item para compartilhar**: nome, descrição, imagem, preço único, campo "serve até N pessoas". Cobre as Tábuas Especiais.
  - **Modelo D — Item com variações de mesmo preço (sabor/opção)**: um produto "pai" com uma lista de variações que compartilham o mesmo preço (ex.: Cachaça de Sabores tem 8 sabores ao mesmo preço) — evita cadastrar itens quase idênticos separadamente. ⚠️ Sugestão de design, não decisão fechada com o cliente: confirmar com o Aquiles se ele quer variação por sabor num único cadastro, ou prefere um item por sabor (mais simples de implementar na v1, porém mais repetitivo de manter). Se não confirmado a tempo, a v1 pode tratar como itens separados (Modelo A) sem prejuízo ao restante do escopo.
  - Um cadastro de produto não precisa ser 4 formulários distintos — pode ser um único formulário flexível que cobre os 4 padrões (ex.: campo de preço único vs. dois preços rotulados vs. variações), desde que suporte esses 4 casos reais sem exigir gambiarra do Administrador.
- **Casos de borda relevantes**:
  - No WordPress atual, uma alteração às vezes "não pega" até o usuário navegar novamente — a nova plataforma precisa refletir a alteração de forma confiável e imediata, sem exigir um passo extra do Administrador.
  - Os avisos de taxa de embalagem (R$ 2,00) e couvert artístico (R$ 10,00), hoje soltos no cardápio em WordPress, não são produtos — precisam de algum espaço no painel (ex.: um bloco de aviso/texto livre), mas não devem ser modelados como item de cardápio.

## Módulo 2 — Cardápio Público
- **Descrição**: página pública do cardápio, acessada pelo cliente do salão (ex.: via QR code na mesa), refletindo em tempo real o que está configurado no painel de gestão.
- **Atores / perfis envolvidos**: Cliente do salão (sem cadastro/login).
- **Regras de negócio**:
  - Layout responsivo, priorizando celular (mobile-first) — o cardápio atual já tem bugs de exibição em iOS e Android que a nova versão precisa eliminar.
  - Qualquer alteração feita no painel de gestão (Módulo 1) aparece no cardápio público sem necessidade de publicação manual separada.
  - Botão "Chamar garçom" integrado à própria página do cardápio, acionando o Módulo 3.
  - Não há carrinho, pedido, controle de esgotado, horário de funcionamento ou delivery nesta versão — o cardápio é somente para consulta.
- **Dados envolvidos**: os mesmos dados do Módulo 1, em modo somente leitura.
- **Casos de borda relevantes**: cliente do salão não deve precisar de nenhum cadastro ou login para visualizar o cardápio ou chamar o garçom.

## Módulo 3 — Chamada de Garçom
- **Descrição**: núcleo do diferencial do projeto — permite ao cliente do salão chamar um garçom a partir da própria mesa, e organiza esse chamado numa fila em tempo real para os garçons.
- **Atores / perfis envolvidos**: Cliente do salão (aciona o chamado), Garçom (visualiza a fila e aceita).
- **Regras de negócio**:
  - Cada mesa tem um QR code próprio, gerado pela própria plataforma (ferramenta interna de geração de QR, não depende de serviço externo).
  - Os chamados aparecem numa fila em tempo real, em ordem de chegada (o primeiro chamado aparece primeiro).
  - O aceite de um chamado é **exclusivo**: assim que um garçom aceita, o chamado sai da fila (ou muda de status) para os demais garçons, evitando que dois garçons atendam a mesma mesa.
  - A notificação ao garçom acontece **dentro da própria plataforma** (tela/fila dedicada) — não via push do sistema operacional nem WhatsApp, que estão fora do escopo contratado.
- **Dados envolvidos**: mesa de origem do chamado, horário da solicitação, status do chamado (pendente/aceito), garçom que aceitou.
- **Casos de borda relevantes**:
  - Dois garçons podem tentar aceitar o mesmo chamado quase simultaneamente — a regra de aceite exclusivo precisa garantir que só um deles "ganhe" o atendimento, e o outro veja que já foi aceito.
  - Confiabilidade de notificação depende do dispositivo do garçom (tela fixa vs. celular pessoal) — ver pendência em `00-contexto-e-escopo.md`. Se o garçom usar celular pessoal com tela bloqueada, a experiência de "chamado em tempo real" pode falhar silenciosamente; isso é um risco de adoção, não só técnico.

## Módulo 4 — Registro de Eventos
- **Descrição**: histórico permanente de cada chamado feito no Módulo 3, alimentando o Painel Gerencial (Módulo 5).
- **Atores / perfis envolvidos**: Administrador (consulta), sistema (grava automaticamente a partir do Módulo 3).
- **Regras de negócio**: todo chamado gera um registro com mesa, horário da solicitação, horário do aceite e garçom responsável — sem exceção, mesmo que o chamado nunca seja aceito (dado necessário para medir mesas com maior tempo de espera no Módulo 5).
- **Dados envolvidos**: mesa, horário da solicitação, horário do aceite (se houver), garçom responsável (se houver).
- **Casos de borda relevantes**: um chamado que nunca é aceito (ex.: cliente desiste, ou falha de app) precisa continuar registrado, para não distorcer as métricas do Módulo 5 silenciosamente.

## Módulo 5 — Painel Gerencial
- **Descrição**: dashboard para o Administrador acompanhar o desempenho do atendimento de salão.
- **Atores / perfis envolvidos**: Administrador.
- **Regras de negócio**:
  - Indicadores mínimos: tempo médio entre chamado e atendimento; mesas com maior tempo de espera; atendimentos por garçom e por dia; filtros e relatórios visuais.
  - Como esse painel mede desempenho individual por garçom, ele só é útil se os garçons realmente usarem o aceite exclusivo do Módulo 3 — se não usarem, o dado fica falso e a "culpa" tende a recair sobre a plataforma, não sobre o processo. Isso é um risco de adoção da equipe, não um bug: vale um alinhamento operacional com o Aquiles antes do go-live (ex.: tornar o uso do aceite um pré-requisito de turno).
- **Dados envolvidos**: os mesmos do Módulo 4, agregados e filtráveis (por garçom, por dia, por mesa).
- **Casos de borda relevantes**: ver risco de adoção acima — o painel deve deixar claro quando os dados são insuficientes (ex.: poucos chamados aceitos no período) para não sugerir uma leitura de desempenho enganosa.

## Módulo 6 — Usuários e Permissões
- **Descrição**: cadastro dos usuários internos que operam a plataforma.
- **Atores / perfis envolvidos**: Administrador (cadastra e gerencia), Garçom (usa a própria conta).
- **Regras de negócio**:
  - Apenas usuários internos são cadastrados (Administrador e Garçom) — o cliente do salão nunca tem conta.
  - Cada garçom tem login individual (é o que sustenta a atribuição de desempenho por garçom no Módulo 5 e o aceite exclusivo no Módulo 3).
- **Dados envolvidos**: nome do usuário, perfil (Administrador ou Garçom), credenciais de acesso.
- **Casos de borda relevantes**: não se aplica além do já descrito — não há hierarquia adicional de permissões dentro do perfil Garçom nesta versão.

## Perfis de acesso — visão consolidada

| Perfil | Pode | Não pode |
|---|---|---|
| **Administrador** | Gerenciar cardápio completo (Módulo 1); cadastrar mesas; cadastrar usuários/garçons (Módulo 6); visualizar o Painel Gerencial completo (Módulo 5); consultar o histórico de eventos (Módulo 4) | Acessar como cliente do salão (usa a própria visão administrativa) |
| **Garçom** | Visualizar a fila de chamados e aceitar chamados (Módulo 3), com login individual | Editar cardápio; acessar o Painel Gerencial; cadastrar usuários ou mesas |
| **Cliente do salão** | Visualizar o cardápio público (Módulo 2); chamar um garçom pela mesa (Módulo 3) | Qualquer ação administrativa; não precisa de cadastro ou login |
