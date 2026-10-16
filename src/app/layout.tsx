import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { urlImagemProduto } from "@/lib/imagem";
import { carregarMarca } from "@/lib/marca";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { nome, faviconPath } = await carregarMarca();
  const faviconUrl = urlImagemProduto(faviconPath);

  return {
    title: nome,
    description: `Plataforma de cardápio digital e atendimento de salão — ${nome}`,
    // appleWebApp: sem isso, "Adicionar à Tela de Início" no iPhone abre num
    // navegador comum (com barra de endereço) em vez de tela cheia — e o Web
    // Push da Apple exige o app rodando nesse modo "standalone".
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: nome,
    },
    icons: {
      icon: faviconUrl ?? "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
