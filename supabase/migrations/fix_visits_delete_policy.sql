-- OKKA Platform - Migration: Corrigir políticas de DELETE em visits (versão corrigida)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Remover TODAS as políticas existentes na tabela visits (nomes exatos)
drop policy if exists "Usuários autenticados podem gerenciar visitas" on public.visits;
drop policy if exists "Administradores têm permissão total em visits" on public.visits;
drop policy if exists "Admins e Mestres têm permissão total em visits" on public.visits;
drop policy if exists "Técnicos podem ver suas próprias visitas" on public.visits;
drop policy if exists "Técnicos podem atualizar suas próprias visitas" on public.visits;
drop policy if exists "Tecnicos e Instaladores podem ver suas visitas" on public.visits;
drop policy if exists "Tecnicos podem atualizar suas visitas" on public.visits;

-- 2. Admins e Mestres: permissão TOTAL (select, insert, update, delete)
create policy "Admins e Mestres têm permissão total em visits"
  on public.visits for all
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
    OR
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role IN ('admin', 'mestre')
    )
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
    OR
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role IN ('admin', 'mestre')
    )
  );

-- 3. Técnicos e Instaladores: ver apenas as suas próprias visitas
create policy "Tecnicos e Instaladores podem ver suas visitas"
  on public.visits for select
  to authenticated
  using (
    tecnico_id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'mestre')
    OR exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role IN ('admin', 'mestre')
    )
  );

-- 4. Técnicos: atualizar suas próprias visitas
create policy "Tecnicos podem atualizar suas visitas"
  on public.visits for update
  to authenticated
  using (tecnico_id = auth.uid())
  with check (tecnico_id = auth.uid());
