-- Migration: Adicionar campos completos de CRM na tabela Leads
-- Execute este script no Editor SQL do seu projeto Supabase para habilitar o cadastro completo.

alter table public.leads
add column if not exists endereco_obra text,
add column if not exists valor_estimado numeric(12,2) default 0.00,
add column if not exists materiais_previstos jsonb default '[]'::jsonb,
add column if not exists observacoes text;
