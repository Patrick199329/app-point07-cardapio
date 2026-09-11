import "server-only";

import QRCode from "qrcode";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/** URL que o QR da mesa aponta: abre o cardápio e habilita "chamar garçom". */
export function urlDaMesa(qrToken: string): string {
  return `${BASE}/mesa/${qrToken}`;
}

/** True quando a base ainda é local — não deve imprimir para produção assim. */
export function baseEhLocal(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SITE_URL ||
    /localhost|127\.0\.0\.1|0\.0\.0\.0|::1/.test(process.env.NEXT_PUBLIC_SITE_URL)
  );
}

export function baseAtual(): string {
  return BASE;
}

/** SVG do QR code (string), nítido em qualquer tamanho de impressão. */
export function qrSvg(conteudo: string): Promise<string> {
  return QRCode.toString(conteudo, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#111111", light: "#ffffff" },
  });
}
