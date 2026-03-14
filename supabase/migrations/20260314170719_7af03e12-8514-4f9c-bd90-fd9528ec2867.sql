
-- 1. Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  tipo_ug TEXT DEFAULT '',
  regiao TEXT DEFAULT '',
  consultor TEXT DEFAULT '',
  status_cliente TEXT DEFAULT 'Ativo',
  observacoes_cliente TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_modulo TEXT NOT NULL UNIQUE,
  categoria_modulo TEXT DEFAULT '',
  status_modulo TEXT DEFAULT 'Ativo',
  descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Client-Modules relationship
CREATE TABLE public.client_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  valor_contratado NUMERIC DEFAULT 0,
  valor_faturado NUMERIC DEFAULT 0,
  data_assinatura DATE,
  vencimento_contrato DATE,
  faturado_flag BOOLEAN DEFAULT false,
  status_contrato TEXT DEFAULT 'Ativo',
  observacoes TEXT DEFAULT '',
  ativo_no_cliente BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, modulo_id)
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;

-- Permissive policies (anon access for now)
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to modules" ON public.modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to client_modules" ON public.client_modules FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON public.client_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
