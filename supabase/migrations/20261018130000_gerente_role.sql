-- Point07 — novo perfil "Gerente" (intermediário entre Garçom e Administrador
-- na origem, mas por decisão do cliente opera com o mesmo nível de acesso do
-- Administrador — só muda o rótulo exibido na equipe).
--
-- `alter type ... add value` fica isolado nesta migration (sem usar o valor
-- novo na mesma transação) porque o Postgres não permite usar um valor de
-- enum recém-criado antes do commit que o adicionou.

alter type public.user_role add value 'gerente';
