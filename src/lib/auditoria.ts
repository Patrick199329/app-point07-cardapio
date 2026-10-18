import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/types/database";

export type AuditoriaTipo = Database["public"]["Enums"]["auditoria_tipo"];

export type LogAuditoria = Database["public"]["Tables"]["logs_auditoria"]["Row"];

export const TIPO_LABEL: Record<AuditoriaTipo, string> = {
  criacao: "Criação",
  edicao: "Edição",
  exclusao: "Exclusão",
  entrada: "Entrada",
  saida: "Saída",
};

export const TIPO_BADGE: Record<AuditoriaTipo, "success" | "outline" | "destructive" | "secondary"> = {
  criacao: "success",
  edicao: "outline",
  exclusao: "destructive",
  entrada: "secondary",
  saida: "secondary",
};

/** Nome da tabela (coluna `tabela` em logs_auditoria) → rótulo amigável pra exibir em "Área". */
export const AREA_LABEL: Record<string, string> = {
  profiles: "Usuários",
  mesas: "Mesas",
  categorias: "Cardápio — categorias",
  produtos: "Cardápio — produtos",
  produto_grupos_opcoes: "Cardápio — opções",
  produto_opcoes: "Cardápio — opções",
  avisos: "Cardápio — avisos",
  cardapio_config: "Configurações — aparência do cardápio",
  sistema_config: "Configurações — identidade do sistema",
  fila_config: "Configurações — fila",
};

/** Agrupamento mais grosso, usado no filtro "Área" da tela (dropdown menor que a lista de tabelas). */
export const AREA_GRUPOS: { key: string; label: string; tabelas: string[] }[] = [
  { key: "usuarios", label: "Usuários", tabelas: ["profiles"] },
  { key: "mesas", label: "Mesas", tabelas: ["mesas"] },
  {
    key: "cardapio",
    label: "Cardápio",
    tabelas: ["categorias", "produtos", "produto_grupos_opcoes", "produto_opcoes", "avisos"],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    tabelas: ["cardapio_config", "sistema_config", "fila_config"],
  },
  { key: "sessao", label: "Sessão", tabelas: [] }, // entrada/saída — tabela é null
];

export function rotuloArea(tabela: string | null): string {
  if (!tabela) return "Sessão";
  return AREA_LABEL[tabela] ?? tabela;
}

/** Tenta extrair um rótulo legível do registro afetado a partir do antes/depois (jsonb). */
export function extrairRotuloRegistro(antes: unknown, depois: unknown): string {
  const dados = (depois ?? antes) as Record<string, unknown> | null;
  if (!dados || typeof dados !== "object") return "—";
  for (const campo of ["nome", "identificador", "titulo", "email"]) {
    const valor = dados[campo];
    if (typeof valor === "string" && valor.trim()) return valor;
  }
  return "—";
}

type RegistrarAuditoriaInput = {
  tipo: AuditoriaTipo;
  tabela?: string;
  registroId?: string;
  antes?: Record<string, unknown> | null;
  depois?: Record<string, unknown> | null;
};

/**
 * Registro manual de auditoria — só pros casos sem trigger de tabela
 * aplicável (login/logout, criação de usuário, redefinição de senha; ver
 * supabase/migrations/20261018150000_logs_auditoria.sql e
 * .../20261018150100_logs_auditoria_triggers.sql pro porquê). A maioria das
 * edições do painel já é capturada sozinha pelo trigger genérico, sem
 * precisar chamar isso.
 */
export async function registrarAuditoria(
  supabase: SupabaseClient<Database>,
  { tipo, tabela, registroId, antes, depois }: RegistrarAuditoriaInput,
) {
  await supabase.rpc("registrar_auditoria_manual", {
    p_tipo: tipo,
    p_tabela: tabela,
    p_registro_id: registroId,
    p_antes: (antes ?? undefined) as Json | undefined,
    p_depois: (depois ?? undefined) as Json | undefined,
  });
}
