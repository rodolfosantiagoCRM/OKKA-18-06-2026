-- OKKA Platform - Migration: Módulo de Gestão de Identidade e Acessos (IAM)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Limpar triggers e funções antigas
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.profiles cascade;

-- 2. Criar a nova tabela pública perfis_usuarios
create table public.perfis_usuarios (
  id uuid references auth.users on delete cascade primary key,
  nome_completo text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'instalador', 'tecnico')),
  status_acesso boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar RLS em perfis_usuarios
alter table public.perfis_usuarios enable row level security;

-- 4. Criar políticas RLS para perfis_usuarios (usando metadados JWT para evitar recursão infinita)
create policy "Administradores podem gerenciar todos os perfis"
  on public.perfis_usuarios for all
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Usuários podem ver seu próprio perfil"
  on public.perfis_usuarios for select
  to authenticated
  using (id = auth.uid());

-- 5. Trigger para criar perfil automaticamente no SignUp (registro do usuário)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis_usuarios (id, nome_completo, email, role, status_acesso)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário OKKA'),
    coalesce(new.email, 'sem-email@okka.com'),
    coalesce(new.raw_user_meta_data->>'role', 'instalador'),
    coalesce((new.raw_user_meta_data->>'status_acesso')::boolean, true)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Atualizar as políticas da tabela responsaveis_tecnicos para usar perfis_usuarios
drop policy if exists "Apenas administradores podem gerenciar responsaveis_tecnicos" on public.responsaveis_tecnicos;

create policy "Apenas administradores podem gerenciar responsaveis_tecnicos"
  on public.responsaveis_tecnicos for all
  to authenticated
  using (
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role = 'admin'
    )
  );

-- 7. Atualizar as políticas da tabela visits para usar perfis_usuarios
drop policy if exists "Administradores têm permissão total em visits" on public.visits;

create policy "Administradores têm permissão total em visits"
  on public.visits for all
  to authenticated
  using (
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.perfis_usuarios
      where perfis_usuarios.id = auth.uid()
      and perfis_usuarios.role = 'admin'
    )
  );
