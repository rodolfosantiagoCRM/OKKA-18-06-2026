-- Migration: Criar tabela de tipos de serviço e atualizar tabela de materiais

-- 1. Criar tabela de tipos de serviço
CREATE TABLE IF NOT EXISTS public.tipos_servico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text UNIQUE NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tipos_servico
ALTER TABLE public.tipos_servico ENABLE ROW LEVEL SECURITY;

-- Política de RLS para tipos_servico
DROP POLICY IF EXISTS "Tipos servico multi-tenant policy" ON public.tipos_servico;
CREATE POLICY "Tipos servico multi-tenant policy" ON public.tipos_servico
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR empresa_id = public.get_my_empresa_id() OR empresa_id = '00000000-0000-0000-0000-000000000000')
  WITH CHECK (public.is_super_admin() OR empresa_id = public.get_my_empresa_id());

-- Função e Trigger para preencher automatico o empresa_id do tipo_servico
CREATE OR REPLACE FUNCTION public.set_tipos_servico_empresa_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := public.get_my_empresa_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_set_tipos_servico_empresa_id ON public.tipos_servico;
CREATE TRIGGER tr_set_tipos_servico_empresa_id
  BEFORE INSERT OR UPDATE ON public.tipos_servico
  FOR EACH ROW EXECUTE FUNCTION public.set_tipos_servico_empresa_id();

-- Seed inicial de tipos de serviço vinculados à Empresa Padrão
INSERT INTO public.tipos_servico (nome, empresa_id) VALUES
  ('Aquecimento de piso', '00000000-0000-0000-0000-000000000000'),
  ('Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Limpeza de placas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Carregamento Veicular', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (nome) DO NOTHING;

-- 2. Atualizar materiais_predefinidos para vincular a tipo_servico
ALTER TABLE public.materiais_predefinidos ADD COLUMN IF NOT EXISTS tipo_servico text;

-- Atualizar materiais existentes que estão sem tipo de serviço para pertencerem a 'Aquecimento de piso' por padrão
UPDATE public.materiais_predefinidos SET tipo_servico = 'Aquecimento de piso' WHERE tipo_servico IS NULL;

-- Dropar restrições antigas de unicidade e criar restrição composta que inclui tipo_servico
ALTER TABLE public.materiais_predefinidos DROP CONSTRAINT IF EXISTS materiais_predefinidos_nome_key;
ALTER TABLE public.materiais_predefinidos DROP CONSTRAINT IF EXISTS materiais_predefinidos_empresa_id_nome_key;
ALTER TABLE public.materiais_predefinidos ADD CONSTRAINT materiais_predefinidos_empresa_id_nome_tipo_servico_key UNIQUE(empresa_id, nome, tipo_servico);

-- Seed de materiais adicionais para os novos tipos de serviço vinculados à Empresa Padrão
INSERT INTO public.materiais_predefinidos (nome, tipo_servico, empresa_id) VALUES
  ('Painel Solar 550W', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Inversor Monofásico 5kW', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Estrutura de Fixação Telhado', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Cabo Solar 6mm Preto', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Cabo Solar 6mm Vermelho', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Conector MC4', 'Instalação Sistemas Solares', '00000000-0000-0000-0000-000000000000'),
  
  ('Escova de Limpeza Extensível', 'Limpeza de placas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Detergente Neutro Solar', 'Limpeza de placas Solares', '00000000-0000-0000-0000-000000000000'),
  ('Rodo Extensível 6m', 'Limpeza de placas Solares', '00000000-0000-0000-0000-000000000000'),
  
  ('Wallbox 22kW Inteligente', 'Carregamento Veicular', '00000000-0000-0000-0000-000000000000'),
  ('Cabo Tipo 2 Reforçado', 'Carregamento Veicular', '00000000-0000-0000-0000-000000000000'),
  ('Disjuntor 32A Bipolar', 'Carregamento Veicular', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (empresa_id, nome, tipo_servico) DO NOTHING;
