-- OKKA Platform - Migration: Add realizada_com_atraso to visits and delay checking trigger
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Adicionar a coluna realizada_com_atraso à tabela visits se não existir
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS realizada_com_atraso boolean DEFAULT false NOT NULL;

-- 2. Criar ou substituir a função de trigger
CREATE OR REPLACE FUNCTION public.check_visit_delay_on_update()
RETURNS trigger AS $$
DECLARE
  _scheduled timestamp;
  _now_sp timestamp;
BEGIN
  -- Data e hora agendadas da visita
  _scheduled := (NEW.data_visita + NEW.horario);
  
  -- Data e hora atual no fuso horário do Brasil (America/Sao_Paulo)
  _now_sp := timezone('America/Sao_Paulo'::text, now());

  -- Se o status mudou para 'Realizada' (ou foi criado diretamente como 'Realizada')
  IF NEW.status_visita = 'Realizada' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status_visita, '') <> 'Realizada') THEN
    -- Se o momento de registrar a realização é após a data/hora agendada, marca com atraso
    IF _now_sp > _scheduled THEN
      NEW.realizada_com_atraso := true;
    END IF;
  END IF;

  -- Se o status for alterado de volta para outra coisa, reseta o indicador
  IF NEW.status_visita <> 'Realizada' THEN
    NEW.realizada_com_atraso := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vincular a função ao trigger na tabela visits
DROP TRIGGER IF EXISTS tr_check_visit_delay_on_update ON public.visits;
CREATE TRIGGER tr_check_visit_delay_on_update
  BEFORE INSERT OR UPDATE OF status_visita, data_visita, horario ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_visit_delay_on_update();
