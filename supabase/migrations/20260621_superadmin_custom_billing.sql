-- OKKA Platform - Migration: Super Admin Custom Billing
-- Execute este script no SQL Editor do seu projeto Supabase para adicionar suporte a faturamento customizado.

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS mensalidade_customizada numeric(12,2) DEFAULT NULL;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS desconto_mensal numeric(12,2) DEFAULT 0.00;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS motivo_desconto text DEFAULT NULL;
