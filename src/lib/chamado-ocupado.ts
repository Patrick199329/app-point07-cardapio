"use client";

/**
 * Sinal simples (mesma aba, mesmo processo JS) de "tem uma ação de chamar o
 * garçom em andamento ou pendente agora". O atualizador automático do
 * cardápio (ver atualizador-publicacao.tsx) espera isso ficar livre antes de
 * recarregar a página — sem isso, um "Publicar" do Administrador bem na hora
 * que o cliente aperta "Chamar garçom" poderia cancelar essa chamada no meio
 * do caminho (o navegador aborta requisições em andamento quando a página
 * recarrega).
 */
let ocupado = false;

export function marcarChamadoOcupado(valor: boolean) {
  ocupado = valor;
}

export function chamadoEstaOcupado() {
  return ocupado;
}
