# Frontend (Next.js App Router) — rotas de OAuth e tela de administração

Pressupõe um projeto com:
- App Router, Server Components/Actions.
- Um helper já existente tipo `getCurrentProfile()` que lê o perfil logado.
- `@supabase/ssr` ou equivalente pro client server-side (`createClient()` de
  `lib/supabase/server.ts`).

Adapte nomes de pastas/imports pras convenções do projeto alvo.

## 1. Helper de permissão

Em `lib/supabase/profile.ts` (ou arquivo equivalente), adiciona o campo no
tipo do perfil e a função de checagem:

```ts
export type Profile = {
  // ...campos já existentes...
  eh_admin_innovation: boolean; // troque pelo nome escolhido na migration 1
};

export function ehAdminInnovation(profile: Profile | null): boolean {
  return profile?.eh_admin_innovation === true;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, nome, role, status, eh_admin_innovation') // inclui a coluna nova
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
}
```

## 2. Tipos — `types/backup.ts`

```ts
export type BackupStatus = 'em_andamento' | 'sucesso' | 'erro';

export type BackupLog = {
  id: string;
  iniciado_em: string;
  concluido_em: string | null;
  status: BackupStatus;
  drive_arquivo_id: string | null;
  drive_arquivo_url: string | null;
  tamanho_bytes: number | null;
  mensagem_erro: string | null;
  disparado_manualmente: boolean;
};

export const BACKUP_STATUS_LABELS: Record<BackupStatus, string> = {
  em_andamento: 'Em andamento',
  sucesso: 'Sucesso',
  erro: 'Erro',
};

export const BACKUP_STATUS_TONES: Record<BackupStatus, 'active' | 'pending' | 'inactive'> = {
  em_andamento: 'pending',
  sucesso: 'active',
  erro: 'inactive',
};

const VALIDADE_TOKEN_GOOGLE_DIAS = 7;

// Enquanto o app OAuth do Google ficar em modo "Testing", o refresh token
// expira ~7 dias depois de emitido. Função separada (não inline no corpo de
// um componente) porque chamar Date.now() direto durante a renderização
// viola a regra de pureza do React/Next — calcule sempre num Server
// Component, nunca dentro do componente de UI em si.
export function calcularDiasRestantesAutorizacaoGoogle(atualizadoEm: string | null): number | null {
  if (!atualizadoEm) return null;
  const diasDecorridos = Math.floor((Date.now() - new Date(atualizadoEm).getTime()) / (24 * 60 * 60 * 1000));
  return VALIDADE_TOKEN_GOOGLE_DIAS - diasDecorridos;
}

export function formatarBytes(bytes: number | null): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
```

## 3. Rota — iniciar a autorização

`app/api/google-oauth/iniciar/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { ehAdminInnovation, getCurrentProfile } from '@/lib/supabase/profile';

// Primeiro passo do botão "Autorizar Google Drive" — manda pra tela de
// permissão do Google. access_type=offline + prompt=consent garantem que um
// refresh_token novo sempre volte, mesmo que a pessoa já tenha autorizado
// antes (sem isso o Google às vezes pula o refresh_token numa reautorização).
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!ehAdminInnovation(profile)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/admin/backups?erro=' + encodeURIComponent('GOOGLE_CLIENT_ID não configurado.'), request.url),
    );
  }

  const redirectUri = new URL('/api/google-oauth/callback', request.url).toString();

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return NextResponse.redirect(url);
}
```

## 4. Rota — callback (troca o código pelo token)

`app/api/google-oauth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { ehAdminInnovation, getCurrentProfile } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/server';

// Segundo passo — o Google manda a pessoa de volta pra cá com um código,
// trocado aqui por um refresh_token salvo em integracao_google_drive. A
// rotina de backup lê sempre o valor mais recente dali, então essa troca de
// token não precisa mexer em nenhum secret do GitHub.
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!ehAdminInnovation(profile)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const erroGoogle = request.nextUrl.searchParams.get('error');
  if (erroGoogle) {
    return NextResponse.redirect(
      new URL(`/admin/backups?erro=${encodeURIComponent('Autorização cancelada no Google.')}`, request.url),
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(
      new URL(`/admin/backups?erro=${encodeURIComponent('Código de autorização ausente.')}`, request.url),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(
        `/admin/backups?erro=${encodeURIComponent('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados.')}`,
        request.url,
      ),
    );
  }

  const redirectUri = new URL('/api/google-oauth/callback', request.url).toString();

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok || !dados.refresh_token) {
    const mensagem = dados.refresh_token
      ? dados.error_description || 'Erro ao trocar o código pelo token.'
      : 'O Google não devolveu um refresh token — tente novamente (às vezes é preciso revogar o acesso anterior em myaccount.google.com/permissions e autorizar de novo).';
    return NextResponse.redirect(new URL(`/admin/backups?erro=${encodeURIComponent(mensagem)}`, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('integracao_google_drive')
    .update({
      refresh_token: dados.refresh_token,
      atualizado_em: new Date().toISOString(),
      atualizado_por: profile!.id,
    })
    .eq('id', true);

  if (error) {
    return NextResponse.redirect(new URL(`/admin/backups?erro=${encodeURIComponent(error.message)}`, request.url));
  }

  return NextResponse.redirect(new URL('/admin/backups?autorizado=1', request.url));
}
```

## 5. Server Action — disparar backup manual via API do GitHub

`app/(dashboard)/admin/backups/actions.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { ehAdminInnovation, getCurrentProfile } from '@/lib/supabase/profile';

export type BackupFormState = {
  error: string | null;
  sucesso?: boolean;
};

// Só pede pro GitHub começar a rodar — quem de fato faz o dump e grava o
// resultado em backup_logs é a rotina em si (via service_role). Precisa de
// GITHUB_PAT (fine-grained, permissão "Actions: write" só nesse
// repositório) e GITHUB_REPO ("dono/repo") nas variáveis de ambiente da
// APLICAÇÃO (não do GitHub Actions — essas duas são só pra ESTE botão).
export async function dispararBackupManual(): Promise<BackupFormState> {
  const profile = await getCurrentProfile();
  if (!ehAdminInnovation(profile)) {
    throw new Error('Não autorizado.');
  }

  const token = process.env.GITHUB_PAT;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return { error: 'Backup manual ainda não configurado (faltam GITHUB_PAT e GITHUB_REPO).' };
  }

  const resposta = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/backup-diario.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: process.env.GITHUB_BRANCH || 'main' }),
    },
  );

  if (!resposta.ok) {
    const texto = await resposta.text();
    return { error: `Não foi possível disparar o backup agora (${resposta.status}): ${texto}` };
  }

  revalidatePath('/admin/backups');
  return { error: null, sucesso: true };
}
```

O `GITHUB_PAT` usado aqui é **diferente** do contexto do workflow — é criado
em *Settings da conta GitHub → Developer settings → Personal access tokens →
Fine-grained*, restrito a **"Only select repositories"** (só o repositório
do projeto), com permissão de **"Actions: Read and write"**.

## 6. Página de administração (Server Component)

`app/(dashboard)/admin/backups/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { dispararBackupManual } from './actions';
import { ehAdminInnovation, getCurrentProfile } from '@/lib/supabase/profile';
import { createClient } from '@/lib/supabase/server';
import { calcularDiasRestantesAutorizacaoGoogle, type BackupLog } from '@/types/backup';
import { BackupsList } from '@/components/backups-list';

type BackupsPageProps = {
  searchParams: Promise<{ erro?: string; autorizado?: string }>;
};

export default async function BackupsPage({ searchParams }: BackupsPageProps) {
  const profile = await getCurrentProfile();
  if (!ehAdminInnovation(profile)) {
    redirect('/dashboard');
  }

  const { erro, autorizado } = await searchParams;
  const supabase = await createClient();
  const [{ data: backups }, { data: integracaoGoogle }] = await Promise.all([
    supabase.from('backup_logs').select('*').order('iniciado_em', { ascending: false }).limit(60).returns<BackupLog[]>(),
    supabase.from('integracao_google_drive').select('atualizado_em').eq('id', true).single(),
  ]);

  const diasRestantesGoogle = calcularDiasRestantesAutorizacaoGoogle(integracaoGoogle?.atualizado_em ?? null);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Backups</h1>
      <BackupsList
        backups={backups ?? []}
        dispararBackupManual={dispararBackupManual}
        diasRestantesGoogle={diasRestantesGoogle}
        erroQuery={erro ?? null}
        autorizadoQuery={autorizado === '1'}
      />
    </div>
  );
}
```

## 7. Componente da tela (Client Component)

`components/backups-list.tsx` — botão de autorização (com aviso de validade),
botão de backup manual, e a tabela de histórico:

```tsx
'use client';

import { useState, useTransition } from 'react';
import type { BackupFormState } from '@/app/(dashboard)/admin/backups/actions';
import { BACKUP_STATUS_LABELS, BACKUP_STATUS_TONES, formatarBytes, type BackupLog } from '@/types/backup';

type BackupsListProps = {
  backups: BackupLog[];
  dispararBackupManual: () => Promise<BackupFormState>;
  diasRestantesGoogle: number | null;
  erroQuery: string | null;
  autorizadoQuery: boolean;
};

export function BackupsList({
  backups,
  dispararBackupManual,
  diasRestantesGoogle: diasRestantes,
  erroQuery,
  autorizadoQuery,
}: BackupsListProps) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<BackupFormState | null>(null);

  function disparar() {
    startTransition(async () => {
      setResultado(await dispararBackupManual());
    });
  }

  const precisaAutorizar = diasRestantes === null || diasRestantes <= 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Cartão de autorização do Google */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
        <div>
          <p className="text-sm font-medium">Autorização do Google Drive</p>
          <p className="text-sm text-muted-foreground">
            {diasRestantes === null
              ? 'Ainda não autorizado — o backup não vai conseguir salvar no Drive até isso ser feito.'
              : diasRestantes <= 0
                ? 'Expirada — reautorize pra voltar a funcionar.'
                : `Válida por mais ${diasRestantes} dia(s) (enquanto o app estiver em modo de teste no Google).`}
          </p>
        </div>
        <a
          href="/api/google-oauth/iniciar"
          className={precisaAutorizar ? 'botão-destaque' : 'botão-secundário'}
        >
          {diasRestantes === null ? 'Autorizar Google Drive' : 'Renovar autorização'}
        </a>
      </div>

      {/* Backup manual */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
        <p className="text-sm text-muted-foreground">
          A rotina diária roda sozinha; use o botão abaixo só se precisar de um backup extra agora.
        </p>
        <button type="button" onClick={disparar} disabled={pending}>
          {pending ? 'Disparando…' : 'Rodar backup agora'}
        </button>
      </div>

      {resultado?.error ? <p className="text-red-600">{resultado.error}</p> : null}
      {resultado?.sucesso ? <p className="text-green-600">Backup disparado — acompanhe na lista abaixo.</p> : null}
      {erroQuery ? <p className="text-red-600">{erroQuery}</p> : null}
      {autorizadoQuery ? <p className="text-green-600">Google Drive autorizado com sucesso.</p> : null}

      {/* Histórico */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Início</th>
            <th>Status</th>
            <th>Tamanho</th>
            <th>Origem</th>
            <th>Arquivo</th>
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr key={b.id}>
              <td>{new Date(b.iniciado_em).toLocaleString('pt-BR')}</td>
              <td>
                {BACKUP_STATUS_LABELS[b.status]}
                {b.status === 'erro' && b.mensagem_erro ? <p className="text-xs text-red-600">{b.mensagem_erro}</p> : null}
              </td>
              <td>{formatarBytes(b.tamanho_bytes)}</td>
              <td>{b.disparado_manualmente ? 'Manual' : 'Diário'}</td>
              <td>
                {b.drive_arquivo_url ? (
                  <a href={b.drive_arquivo_url} target="_blank" rel="noopener noreferrer">Abrir no Drive</a>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

(O JSX acima usa classes genéricas de placeholder — troque pelo sistema de
estilo/design system do projeto alvo. A lógica de estado/props é o que
importa reaproveitar.)

## 8. Navegação

Adicionar um link pra `/admin/backups` em algum menu/sidebar, **visível só
quando `ehAdminInnovation(profile)` for verdadeiro** — mesmo princípio de
gate usado na própria página.
