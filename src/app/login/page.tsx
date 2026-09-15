import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { carregarLogoSistema } from "@/lib/sistema";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — Point07",
};

export default async function LoginPage() {
  const logoUrl = await carregarLogoSistema();

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center space-y-1 text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Point07"
              className="h-14 w-auto max-w-full object-contain"
            />
          ) : (
            <CardTitle className="text-2xl">Point07</CardTitle>
          )}
          <CardDescription>
            Acesso restrito à equipe. Entre com seu e-mail e senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
