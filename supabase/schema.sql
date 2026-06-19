-- OKKA Platform - Database Schema Migration
-- Execute this script in the SQL Editor of your Supabase project.

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- =========================================================================
-- 1. TABELA PROFILES (Autenticação e Perfil de Usuário)
-- =========================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'tecnico')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de RLS
create policy "Qualquer usuário autenticado pode ver profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuários podem editar seus próprios profiles"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger para criar perfil automaticamente no SignUp (registro do usuário)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuário OKKA'),
    coalesce(new.raw_user_meta_data->>'role', 'tecnico')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 2. TABELA LEADS (Capturas da Landing Page / Contatos Iniciais)
-- =========================================================================
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  email text,
  telefone text not null,
  cidade text not null,
  area_m2 numeric(10,2),
  status text default 'Novo' not null check (status in ('Novo', 'Em Contato', 'Qualificado', 'Perdido')),
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.leads enable row level security;

-- Políticas de RLS
create policy "Público pode criar leads pela Landing Page"
  on public.leads for insert
  to public
  with check (true);

create policy "Usuários autenticados podem ver leads"
  on public.leads for select
  to authenticated
  using (true);

create policy "Usuários autenticados podem atualizar leads"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuários autenticados podem deletar leads"
  on public.leads for delete
  to authenticated
  using (true);

-- =========================================================================
-- 3. TABELA PROJECTS (Projetos do CRM)
-- =========================================================================
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete set null,
  status_projeto text default 'Orçamento' not null check (status_projeto in ('Orçamento', 'Preparação', 'Instalação', 'Teste de Carga', 'Concluído')),
  endereco text not null,
  valor_total numeric(12,2) default 0.00 not null,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.projects enable row level security;

-- Políticas de RLS
create policy "Usuários autenticados podem gerenciar projetos"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================================
-- 4. TABELA VISITS (Visitas Técnicas / Relatórios de Campo)
-- =========================================================================
create table public.visits (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  data_visita date not null,
  horario time without time zone not null,
  status_visita text default 'Agendada' not null check (status_visita in ('Agendada', 'Realizada', 'Cancelada')),
  material_usado jsonb default '[]'::jsonb not null,
  valor_gasto numeric(12,2) default 0.00 not null,
  observacoes text,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.visits enable row level security;

-- Políticas de RLS
create policy "Usuários autenticados podem gerenciar visitas"
  on public.visits for all
  to authenticated
  using (true)
  with check (true);
