-- Migration: Create gdrive_config table for multi-tenant backups
-- Execute este script no SQL Editor do seu projeto Supabase se necessário.

CREATE TABLE IF NOT EXISTS public.gdrive_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE UNIQUE,
  folder_id text NOT NULL,
  service_account_json text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.gdrive_config ENABLE ROW LEVEL SECURITY;

-- Remover políticas se existirem
DROP POLICY IF EXISTS "Users can select their own company's gdrive config" ON public.gdrive_config;
DROP POLICY IF EXISTS "Users can manage their own company's gdrive config" ON public.gdrive_config;

-- Política para leitura
CREATE POLICY "Users can select their own company's gdrive config" ON public.gdrive_config
  FOR SELECT TO authenticated USING (empresa_id = public.get_my_empresa_id() OR public.is_super_admin());

-- Política para inserção/edição/deleção
CREATE POLICY "Users can manage their own company's gdrive config" ON public.gdrive_config
  FOR ALL TO authenticated USING (empresa_id = public.get_my_empresa_id() OR public.is_super_admin())
  WITH CHECK (empresa_id = public.get_my_empresa_id() OR public.is_super_admin());
