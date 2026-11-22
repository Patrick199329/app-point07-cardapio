/**
 * Quais arquivos de `produtos/` no storage já não são usados por nenhum
 * produto e podem ser apagados. Função pura (sem acesso ao Supabase) pra ser
 * testada isolada — a limpeza de verdade está em `limparImagensOrfasProdutos`
 * (src/lib/imagem.ts), chamada depois de cada publicação.
 *
 * Só entram arquivos com mais de `idadeMinimaMs`: um upload acabou de ser
 * gravado no storage e ainda pode não ter chegado em `produtos.imagem_path`
 * (a Server Action faz as duas coisas em sequência) — apagar nesse intervalo
 * levaria a foto que acabou de ser enviada.
 */
export function selecionarImagensOrfas(
  arquivos: { name: string; created_at?: string | null }[],
  emUso: Set<string>,
  agoraMs: number,
  idadeMinimaMs = 60 * 60 * 1000,
): string[] {
  return arquivos
    .filter((a) => {
      if (!a.name || !a.created_at) return false;
      if (emUso.has(`produtos/${a.name}`)) return false;
      return agoraMs - new Date(a.created_at).getTime() >= idadeMinimaMs;
    })
    .map((a) => `produtos/${a.name}`);
}
