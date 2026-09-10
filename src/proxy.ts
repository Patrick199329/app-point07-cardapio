import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: o antigo `middleware.ts` foi renomeado para `proxy.ts`
// (runtime nodejs, não configurável). Ver node_modules/next/dist/docs.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, exceto:
     * - _next/static, _next/image (assets internos do Next)
     * - favicon.ico e arquivos de imagem estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
