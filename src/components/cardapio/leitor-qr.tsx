"use client";

import { useEffect, useRef, useState } from "react";

import jsQR from "jsqr";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Leitor de QR code embutido (câmera + jsQR) — usado quando o cliente
 * precisa reler o QR da mesa sem sair do app (ver ConfirmarMesa). Evita o
 * ciclo "minimizar, abrir câmera nativa, escanear, voltar pro navegador".
 */
export function LeitorQr({
  onDetectado,
  onFechar,
}: {
  onDetectado: (conteudo: string) => void;
  onFechar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framePedidoRef = useRef<number | null>(null);
  const detectadoRef = useRef(false);
  const ultimaTentativaRef = useRef(0);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      try {
        // Sem limite de resolução, celular pede a câmera no máximo dele (em
        // alguns chega a 4K) — decodificar isso a cada frame trava o
        // aparelho e a leitura nunca completa a tempo. 1280px já é mais que
        // suficiente pra ler QR code.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        ler(0);
      } catch {
        if (!cancelado) {
          setErro(
            "Não conseguimos acessar a câmera. Você pode escanear o QR code direto pelo aplicativo de câmera do celular.",
          );
        }
      }
    }

    const MAX_LADO = 480; // suficiente pra ler QR, bem mais leve que o frame cheio
    const INTERVALO_MS = 180; // tentar ~5x/s, não a cada frame — celular não aguenta

    function ler(agora: number) {
      if (detectadoRef.current) return;
      if (agora - ultimaTentativaRef.current < INTERVALO_MS) {
        framePedidoRef.current = requestAnimationFrame(ler);
        return;
      }
      ultimaTentativaRef.current = agora;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth) {
        const escala = Math.min(1, MAX_LADO / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * escala);
        canvas.height = Math.round(video.videoHeight * escala);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imagem = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // Nossos QR são sempre escuro sobre claro — "dontInvert" evita o
          // jsQR tentar a leitura invertida à toa, quase 2x mais rápido.
          const resultado = jsQR(imagem.data, imagem.width, imagem.height, {
            inversionAttempts: "dontInvert",
          });
          if (resultado?.data) {
            detectadoRef.current = true;
            onDetectado(resultado.data);
            return;
          }
        }
      }
      framePedidoRef.current = requestAnimationFrame(ler);
    }

    iniciar();

    return () => {
      cancelado = true;
      if (framePedidoRef.current) cancelAnimationFrame(framePedidoRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-sm font-medium">Aponte a câmera para o QR code da mesa</p>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onFechar}>
          <X className="size-5" />
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-64 rounded-2xl border-4 border-white/80" />
        </div>
      </div>

      {erro ? (
        <div className="bg-black p-4 text-center text-sm text-white/90">
          {erro}
          <div className="mt-3">
            <Button variant="secondary" onClick={onFechar}>
              Fechar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
