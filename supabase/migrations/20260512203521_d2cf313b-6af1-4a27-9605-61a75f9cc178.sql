CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1) Audit log do expurgo
INSERT INTO public.audit_logs (action, entity_type, entity_id, details)
SELECT 'bulk_delete_pre_migration', 'client', id::text,
       jsonb_build_object('codigo_cliente', codigo_cliente, 'nome_cliente', nome_cliente)
FROM public.clients
WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128);

-- 2) Excluir lançamentos vinculados
DELETE FROM public.client_modules
WHERE client_id IN (
  SELECT id FROM public.clients
  WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128)
);

-- 3) Excluir clientes
DELETE FROM public.clients
WHERE codigo_cliente IN (1,14,17,40,47,75,123,125,128);

-- 4) Mover códigos atuais para faixa negativa (evita colisão de UNIQUE/index)
UPDATE public.clients SET codigo_cliente = -codigo_cliente;

-- 5) Renumeração alfabética PT-BR (1..N)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY lower(public.unaccent(nome_cliente)) ASC, id ASC
         ) AS novo
  FROM public.clients
)
UPDATE public.clients c
SET codigo_cliente = r.novo
FROM ranked r
WHERE r.id = c.id;

-- 6) Realinhar a sequence
SELECT setval('public.clients_codigo_cliente_seq', (SELECT MAX(codigo_cliente) FROM public.clients));
