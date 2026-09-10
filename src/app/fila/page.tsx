import { SignOutButton } from "@/components/sign-out-button";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "Fila de chamados — Point07" };

export default async function FilaPage() {
  const { profile } = await requireRole("garcom");

  return (
    <main className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="text-sm">
          <span className="font-medium">{profile.nome}</span>
          <span className="ml-2 text-muted-foreground">Garçom</span>
        </div>
        <SignOutButton />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-lg font-semibold">Fila de chamados</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Em construção. A fila de chamados em tempo real (Módulo 3) entra na
          Fase 2. Seu login já está funcionando e vinculado ao perfil Garçom.
        </p>
      </div>
    </main>
  );
}
