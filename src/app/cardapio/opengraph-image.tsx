import { ImageResponse } from "next/og";
import sharp from "sharp";

import { lerCardapioPublicado } from "@/lib/cardapio";
import { urlImagemProduto } from "@/lib/imagem";

// Imagem de pré-visualização do link /cardapio (WhatsApp, Instagram, Facebook…):
// 1200x630, com a logo e o nome do estabelecimento nas cores do cardápio. Gerada
// em PNG porque nem todo app aceita WebP (formato em que a logo é guardada).
export const alt = "Cardápio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Logo/nome/cores vêm do cardápio publicado: refaz de tempos em tempos.
export const revalidate = 300;

async function logoComoPng(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize({ width: 640, height: 280, fit: "inside" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const { config } = await lerCardapioPublicado();
  const url = urlImagemProduto(config.logo_path);
  const logo = url ? await logoComoPng(url) : null;
  // Mesma regra do cabeçalho do cardápio: com logo, o nome só aparece se o
  // Administrador deixou "mostrar o nome junto da logo" ligado.
  const mostrarNome = !logo || config.mostrar_nome_com_logo;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: config.cor_fundo_cabecalho,
          color: config.cor_texto_cabecalho,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 36,
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" style={{ maxWidth: 640, maxHeight: 280 }} />
          ) : null}
          {mostrarNome ? (
            <div
              style={{
                fontSize: logo ? 64 : 96,
                fontWeight: 700,
                textAlign: "center",
                padding: "0 60px",
              }}
            >
              {config.nome_estabelecimento}
            </div>
          ) : null}
          <div style={{ fontSize: 40, opacity: 0.8 }}>Cardápio digital</div>
        </div>
        <div style={{ width: "100%", height: 28, background: config.cor_destaque }} />
      </div>
    ),
    size,
  );
}
