import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { baseAtual, baseEhLocal, qrSvg, urlDaMesa, urlQrUniversal } from "@/lib/qr";

import { type CartaoMesa, ImpressaoCliente } from "./impressao-cliente";
import { QrUniversalToggle } from "./qr-universal-toggle";

export const metadata = { title: "Imprimir QR das mesas" };
export const dynamic = "force-dynamic";

export default async function ImpressaoQrPage() {
  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("id, identificador, qr_token")
    .eq("ativo", true)
    .order("identificador", { ascending: true });

  const { data: universal } = await supabase
    .from("qr_universal")
    .select("token, ativo")
    .eq("id", 1)
    .single();

  const cartoesMesas: CartaoMesa[] = await Promise.all(
    (mesas ?? []).map(async (m) => ({
      id: m.id,
      identificador: m.identificador,
      svg: await qrSvg(urlDaMesa(m.qr_token)),
    })),
  );

  // O QR universal vai como o primeiro cartão (mesmo layout), mas começa
  // desmarcado — não entra de carona numa impressão "selecionar todas as mesas".
  const cartaoUniversal: CartaoMesa | null = universal
    ? {
        id: "universal",
        identificador: "QR universal (cliente escolhe a mesa)",
        rotuloImpresso: "Cardápio",
        svg: await qrSvg(urlQrUniversal(universal.token)),
        iniciaDesmarcado: true,
      }
    : null;
  const cartoes = cartaoUniversal ? [cartaoUniversal, ...cartoesMesas] : cartoesMesas;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/painel/mesas"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Mesas
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Imprimir QR das mesas</h1>
        <p className="text-sm text-muted-foreground">
          Um cartão por mesa. O QR abre o cardápio e habilita o botão “chamar
          garçom” já vinculado à mesa.
        </p>
      </div>

      {baseEhLocal() ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          ⚠️ Gerando com a URL <code>{baseAtual()}</code>. Defina{" "}
          <code>NEXT_PUBLIC_SITE_URL</code> com o domínio real antes de imprimir
          os cartões para produção (Fase 7).
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          URL base dos QR: <code>{baseAtual()}</code>
        </p>
      )}

      {universal ? <QrUniversalToggle ativo={universal.ativo} /> : null}

      {cartoes.length === 0 ? (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          Nenhuma mesa ativa. Cadastre mesas em{" "}
          <Link href="/painel/mesas" className="underline">
            Mesas
          </Link>
          .
        </p>
      ) : (
        <ImpressaoCliente cartoes={cartoes} />
      )}
    </div>
  );
}
