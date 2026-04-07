CREATE TABLE public.ug_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ug_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ug_types" ON public.ug_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage ug_types" ON public.ug_types
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ug_types (nome) VALUES
  ('ASSOCIACAO'),('CAMARA'),('CONSORCIO'),('PREFEITURA'),('PREVIDENCIA'),('SAAE')
ON CONFLICT (nome) DO NOTHING;