-- OKKA Platform - Migration: Atualização de Restrição de Função (Role) para IAM
-- Execute este script no SQL Editor do seu projeto Supabase para permitir novos níveis de acesso.

-- 1. Remover a restrição de role antiga da tabela perfis_usuarios
ALTER TABLE public.perfis_usuarios DROP CONSTRAINT IF EXISTS perfis_usuarios_role_check;

-- 2. Adicionar a nova restrição permitindo mestre e vendedor
ALTER TABLE public.perfis_usuarios ADD CONSTRAINT perfis_usuarios_role_check 
  CHECK (role IN ('admin', 'instalador', 'tecnico', 'mestre', 'vendedor'));
