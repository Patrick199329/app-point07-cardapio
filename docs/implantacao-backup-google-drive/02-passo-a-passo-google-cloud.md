# Passo a passo — Google Cloud / OAuth

Roteiro completo, na ordem certa, incluindo cada erro real encontrado e como
resolver — pra não precisar descobrir de novo por tentativa e erro.

## 1. Projeto e API

1. [console.cloud.google.com](https://console.cloud.google.com) → cria um
   projeto novo (ou usa um existente).
2. **APIs & Services → Library** → busca "Google Drive API" → **Enable**.

## 2. Tela de consentimento OAuth ("Google Auth Platform")

1. **APIs & Services → OAuth consent screen** (em interfaces mais novas do
   Google Cloud, aparece como **"Google Auth Platform"** no menu).
2. Tipo de usuário: **External** (a menos que o projeto tenha uma conta
   Google Workspace própria — nesse caso, **Internal** evita o problema do
   token de 7 dias inteiramente, ver decisão 8 em
   `01-decisoes-de-arquitetura.md`).
3. Preenche nome do app e e-mail de suporte. **Não envia pra verificação.**
4. Em **Público-alvo / Audience**, mesmo mantendo em modo **"Testing"**,
   adiciona a conta que vai autorizar (a dona do Drive de destino) na
   seção de **"Test users"** — sem isso, a autorização falha com:
   > Erro 403: access_denied — "só pode ser acessado por testadores
   > aprovados pelo desenvolvedor"

## 3. Credencial OAuth (Client ID)

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Tipo de aplicativo: "Web application"** — **não "Desktop app"**. Esse
   foi um erro real: "Desktop app" não permite configurar um redirect URI
   próprio, e tanto o OAuth Playground (testes manuais) quanto a rota de
   callback da própria aplicação (produção) precisam de um redirect URI
   específico registrado. Usar "Desktop app" aqui resulta em:
   > Erro 400: redirect_uri_mismatch
3. Em **Authorized redirect URIs**, adiciona os dois:
   ```
   https://developers.google.com/oauthplayground
   https://<SEU-APP>.vercel.app/api/google-oauth/callback
   ```
   (o segundo é a rota de callback descrita em `07-frontend-nextjs.md` —
   troque pelo domínio real da aplicação. Pode adicionar depois, mas sem
   ele o botão "Autorizar Google Drive" dentro do app não funciona.)
4. Guarda o **Client ID** e o **Client Secret** gerados — vão virar
   `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (ver checklist de variáveis).

## 4. Gerar um refresh token manualmente (bootstrap inicial, via OAuth Playground)

Isso é opcional se a implantação já for direto usar o botão "Autorizar
Google Drive" dentro do app (ver `07-frontend-nextjs.md`) assim que ele
estiver no ar. Mas pra testar o `scripts/backup-diario.mjs` **antes** de
montar o frontend, gerar um token manualmente ajuda:

1. Abre o [OAuth Playground](https://developers.google.com/oauthplayground)
   — de preferência numa aba anônima, pra evitar pular direto pra uma conta
   Google já logada no navegador.
2. Ícone de engrenagem (canto superior direito) → marca **"Use your own
   OAuth credentials"** → cola o Client ID e Client Secret do passo 3.
3. Em "Step 1", no campo de escopo manual, cola:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
   → **Authorize APIs**.
4. Loga com a conta dona do Drive de destino, autoriza.
5. De volta no Playground, **"Exchange authorization code for tokens"**
   (Step 2) → copia o **Refresh token** que aparece.

Esse refresh token pode ser colocado direto na tabela `integracao_google_drive`
(coluna `refresh_token`) pra testar o backup antes mesmo de o frontend existir.

## 5. A pasta do Google Drive

1. Cria (ou escolhe) a pasta no Drive onde os backups vão ficar.
2. Copia o **ID da pasta** — é o trecho depois de `/folders/` na URL, ex.:
   `https://drive.google.com/drive/folders/<ESTE-PEDAÇO-É-O-ID>`.
3. Esse valor vira `GOOGLE_DRIVE_FOLDER_ID`.
   **Não** é preciso compartilhar a pasta com nada — como a autenticação
   agora é OAuth da própria pessoa dona da pasta (não uma Service Account),
   ela já tem acesso natural.

## 6. Cuidado ao tentar "Publicar" o app (se for essa a rota escolhida)

Documentado aqui porque foi tentado e revertido na implantação original —
útil saber antes de tentar de novo:

1. **Google Auth Platform → Público-alvo (Audience)** → botão **"Publicar
   app"**.
2. Se o botão estiver desabilitado com a mensagem "conclua a configuração
   na página de branding": a aba **Branding** pede **Nome do app**, **e-mail
   de suporte**, e, se houver um **logotipo enviado**, o Google passa a
   **exigir** preencher também Página inicial, Política de Privacidade e
   Termos de Serviço — e exige comprovar a posse do domínio via **Google
   Search Console** (arquivo de verificação servido na raiz do domínio).
3. Mesmo sem logotipo, publicar com um escopo "sensitive" como `drive.file`
   pode levar a uma segunda camada de checagem automática do Google, que
   recusa a publicação com mensagens como "sua página inicial está
   protegida por login" ou "não explica a finalidade do app" — exatamente
   o tipo de coisa que uma aplicação interna de uso próprio não tem como
   satisfazer sem construir páginas públicas só pra isso.
4. **Conclusão da implantação original**: não vale o esforço pra esse caso
   de uso. Ficou em modo Testing + botão de reautorização (decisão 8 do
   arquivo 01). Only revisitar essa rota se o projeto alvo realmente
   precisar de um token que nunca expira E tiver disposição de montar
   página institucional/política de privacidade reais.

## 7. Se for publicar um arquivo de verificação de domínio (Google Search Console)

Se mesmo assim decidir publicar o app e precisar verificar o domínio: o
Google fornece um arquivo `google<hash>.html` pra servir na raiz do site.
**Atenção pra dois detalhes que custaram tempo**:

- Em projetos Next.js, esse arquivo precisa ir dentro da pasta `public/`
  (não na raiz do repositório) — só arquivos em `public/` são servidos na
  raiz da URL.
- Se a aplicação tiver algum middleware/proxy de autenticação que redireciona
  requisições não-logadas (comum em apps com login), confirme que o
  matcher dele **exclui** arquivos estáticos (`.html`, `.txt`, `.xml`, etc.)
  — senão o crawler do Google (que não está logado) cai num redirecionamento
  pra tela de login em vez de ver o conteúdo de verificação, e a verificação
  falha silenciosamente.
