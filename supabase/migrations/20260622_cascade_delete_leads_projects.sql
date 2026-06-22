-- Migration: Configurar exclusão em cascata (ON DELETE CASCADE) para projetos e visitas ao excluir leads
-- Execute este script no SQL Editor do Supabase para atualizar a estrutura de tabelas.

-- 1. Remover projetos que ficaram órfãos (sem lead associado) devido à regra antiga "set null"
DELETE FROM public.projects WHERE lead_id IS NULL;

-- 2. Alterar a chave estrangeira da tabela 'projects' para deletar em cascata
ALTER TABLE public.projects 
  DROP CONSTRAINT IF EXISTS projects_lead_id_fkey;

ALTER TABLE public.projects 
  ADD CONSTRAINT projects_lead_id_fkey 
  FOREIGN KEY (lead_id) 
  REFERENCES public.leads(id) 
  ON DELETE CASCADE;
