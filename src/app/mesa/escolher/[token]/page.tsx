import type { Metadata } from "next";

import { carregarLogoSistema } from "@/lib/sistema";
import { createClient } from "@/lib/supabase/server";

import { EscolherMesa } from "./escolher-mesa";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Escolha sua mesa",
  robots: { index: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * QR universal: o cliente escolhe em qual mesa está e segue para o fluxo normal
 * (/mesa/<token da mesa>). O banco só devolve os NOMES das mesas aqui — o
 * token de cada mesa só sai na escolha de uma (ver mesa_token_por_qr_universal).
 */
export default async function EscolherMesaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let mesas: { id: string; identificador: string }[] = [];
  if (UUID_RE.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("mesas_por_qr_universal", {
      p_token: token,
    });
    mesas = data ?? [];
  }

  const logoUrl = await carregarLogoSistema();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-6">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Point07" className="mx-auto mb-6 h-12 w-auto object-contain" />
      ) : null}

      {mesas.length === 0 ? (
        <div className="rounded-xl border p-6 text-center">
          <h1 className="text-lg font-semibold">QR indisponível no momento</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Peça ajuda a um garçom ou use o QR code da sua mesa.
          </p>
        </div>
      ) : (
        <EscolherMesa token={token} mesas={mesas} />
      )}
    </main>
  );
}
