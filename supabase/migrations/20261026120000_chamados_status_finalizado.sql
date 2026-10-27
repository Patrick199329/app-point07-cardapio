-- Point07 — Módulo 3: atendimento com início e fim.
-- `aceito` passa a significar "em atendimento" (rótulo na UI); `finalizado` fecha o ciclo.
-- Fica em arquivo separado: um valor novo de enum não pode ser usado na mesma transação
-- que o cria (as constraints/funções que o usam estão na migration seguinte).

alter type public.chamado_status add value if not exists 'finalizado';
