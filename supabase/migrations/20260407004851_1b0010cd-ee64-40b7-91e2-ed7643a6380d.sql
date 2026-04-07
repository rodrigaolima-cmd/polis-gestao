ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS codigo_bling text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nome_fantasia text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cnpj text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS celular text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_nfse text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cliente_desde date,
  ADD COLUMN IF NOT EXISTS municipio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS uf text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_principal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cargo_responsavel text DEFAULT '';