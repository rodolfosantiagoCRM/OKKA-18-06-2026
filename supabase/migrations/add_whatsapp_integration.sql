-- OKKA Platform - Migration: Configuração de Integração com WhatsApp
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Criar a tabela de configuração (tabela singleton, garantindo apenas um registro)
create table if not exists public.whatsapp_config (
  id integer primary key check (id = 1) default 1,
  ativo boolean default false not null,
  api_provider text default 'evolution' not null check (api_provider in ('evolution', 'zapi', 'custom')),
  api_url text,
  api_key text,
  instancia text,
  antecedencia_minutos integer default 60 not null,
  mensagem_template text default 'Olá {nome_tecnico}, sua próxima visita técnica para o cliente {cliente_nome} no endereço {endereco_obra} será daqui a {antecedencia} (agendada para às {horario_visita}).' not null,
  headers_customizados text,
  payload_customizado text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Inserir a linha padrão se não existir
insert into public.whatsapp_config (id, ativo, api_provider, antecedencia_minutos)
values (1, false, 'evolution', 60)
on conflict (id) do nothing;

-- 3. Adicionar colunas de rastreamento na tabela de visitas (visits)
alter table public.visits add column if not exists whatsapp_enviado boolean default false not null;
alter table public.visits add column if not exists whatsapp_log text;

-- 4. Habilitar RLS na tabela de configurações
alter table public.whatsapp_config enable row level security;

-- 5. Criar Políticas de RLS para whatsapp_config
drop policy if exists "Qualquer usuário autenticado pode ver whatsapp_config" on public.whatsapp_config;
create policy "Qualquer usuário autenticado pode ver whatsapp_config"
  on public.whatsapp_config for select
  to authenticated
  using (true);

drop policy if exists "Apenas administradores podem gerenciar whatsapp_config" on public.whatsapp_config;
create policy "Apenas administradores podem gerenciar whatsapp_config"
  on public.whatsapp_config for all
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
