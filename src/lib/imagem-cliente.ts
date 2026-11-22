/**
 * Redução de imagem no navegador, ANTES do upload. Foto de celular tem
 * 3-8MB; a Server Action aceita no máximo 4MB (next.config.ts) e a Vercel
 * recusa corpo acima de 4,5MB. O servidor ainda converte para WebP e
 * redimensiona (src/lib/imagem.ts) — aqui só se tira o peso desnecessário.
 */

/** Abaixo disso o arquivo vai como está (já é leve o bastante). */
const LIMITE_SEM_REDUZIR = 800 * 1024;
/** Maior arquivo que ainda se tenta enviar depois da redução. */
export const LIMITE_ENVIO_BYTES = 3.5 * 1024 * 1024;

async function decodificar(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // 'from-image' aplica a orientação EXIF; a imagem reenviada não tem EXIF,
      // então o .rotate() do servidor vira um no-op (sem girar duas vezes).
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // cai pro <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Devolve o arquivo reduzido (lado maior ≤ `ladoMax`, WebP) ou o próprio
 * arquivo se já é leve ou se o navegador não consegue decodificá-lo.
 */
export async function reduzirImagem(file: File, ladoMax = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= LIMITE_SEM_REDUZIR) return file;

  try {
    const origem = await decodificar(file);
    const largura = "naturalWidth" in origem ? origem.naturalWidth : origem.width;
    const altura = "naturalHeight" in origem ? origem.naturalHeight : origem.height;
    const escala = Math.min(1, ladoMax / Math.max(largura, altura));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(origem, 0, 0, canvas.width, canvas.height);
    if ("close" in origem) origem.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    // Safari antigo não gera WebP e devolve PNG: só vale se ficou menor.
    if (!blob || blob.size >= file.size) return file;

    const nome = file.name.replace(/\.[^.]+$/, "") || "imagem";
    return new File([blob], `${nome}.webp`, { type: blob.type });
  } catch {
    return file;
  }
}

/**
 * Reduz o arquivo escolhido num <input type="file"> e troca o conteúdo do
 * input pelo arquivo reduzido (é ele que o formulário envia). Devolve o
 * arquivo final, ou null se ainda assim ficou grande demais — nesse caso o
 * input é limpo.
 */
export async function prepararArquivoDoInput(
  input: HTMLInputElement,
  ladoMax = 1600,
): Promise<{ file: File | null; grandeDemais: boolean }> {
  const original = input.files?.[0];
  if (!original) return { file: null, grandeDemais: false };

  const reduzido = await reduzirImagem(original, ladoMax);
  if (reduzido.size > LIMITE_ENVIO_BYTES) {
    input.value = "";
    return { file: null, grandeDemais: true };
  }
  if (reduzido !== original) {
    const dt = new DataTransfer();
    dt.items.add(reduzido);
    input.files = dt.files;
  }
  return { file: reduzido, grandeDemais: false };
}
