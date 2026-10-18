import { NextResponse, type NextRequest } from "next/server";

import { ehAdminInnovation, getProfile } from "@/lib/auth";

/**
 * Primeiro passo do botão "Autorizar Google Drive" (tela /painel/backups) —
 * manda pra tela de permissão do Google. access_type=offline + prompt=consent
 * garantem que um refresh_token novo sempre volte, mesmo que a pessoa já
 * tenha autorizado antes (sem isso o Google às vezes pula o refresh_token
 * numa reautorização). Ver docs/implantacao-backup-google-drive/.
 */
export async function GET(request: NextRequest) {
  const result = await getProfile();
  if (!result || !ehAdminInnovation(result.profile)) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL(
        `/painel/backups?erro=${encodeURIComponent("GOOGLE_CLIENT_ID não configurado.")}`,
        request.url,
      ),
    );
  }

  const redirectUri = new URL("/api/google-oauth/callback", request.url).toString();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file");
  url.searchParams.set("access_type", "offline");
  // select_account: sempre mostra o seletor de conta do Google, mesmo que o
  // navegador já tenha uma sessão ativa em outra conta — evita autorizar com
  // a conta errada quando a pessoa tem mais de uma conta Google logada.
  // consent: garante um refresh_token novo mesmo numa reautorização.
  url.searchParams.set("prompt", "select_account consent");

  return NextResponse.redirect(url);
}
