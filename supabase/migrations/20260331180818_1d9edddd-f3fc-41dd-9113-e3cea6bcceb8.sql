ALTER TABLE public.clients ADD COLUMN codigo_cliente SERIAL;
CREATE UNIQUE INDEX idx_clients_codigo ON public.clients (codigo_cliente);