-- OKKA Platform - Migration: Leads ZIP/CEP Column
-- Execute este script no SQL Editor do seu projeto Supabase para adicionar suporte ao campo CEP nos Leads.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cep text DEFAULT NULL;
