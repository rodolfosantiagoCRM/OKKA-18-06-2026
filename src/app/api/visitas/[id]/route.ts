import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * DELETE /api/visitas/[id]
 * Exclui uma visita técnica usando service_role (bypassa RLS completamente).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID da visita não informado.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[API visitas DELETE] Variáveis de ambiente não configuradas.');
    return NextResponse.json(
      { success: false, error: 'Configuração do servidor incompleta.' },
      { status: 500 }
    );
  }

  // Usar service_role para bypassar RLS
  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[API visitas DELETE] Erro ao excluir visita:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
