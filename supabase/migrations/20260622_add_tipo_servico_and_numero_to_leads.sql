-- Migration: Adicionar campos de número de endereço e tipo de serviço aos leads
-- Execute este script no Editor SQL do seu projeto Supabase.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS numero text DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tipo_servico text DEFAULT NULL;
