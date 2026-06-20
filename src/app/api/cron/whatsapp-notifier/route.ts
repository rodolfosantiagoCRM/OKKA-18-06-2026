import { NextRequest, NextResponse } from 'next/server';
import { runCronNotificationCheck } from '@/app/actions/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;

  const expectedSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  // Se houver uma chave secreta configurada no .env.local, exige a autenticação (exceto em desenvolvimento local para testes simples)
  if (expectedSecret && token !== expectedSecret && !isDev) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado. Forneça o token de autorização correspondente.' },
      { status: 401 }
    );
  }

  try {
    const result = await runCronNotificationCheck();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Falha ao processar notificações.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      sentCount: result.sentCount,
      skippedCount: result.skippedCount,
    });
  } catch (err: any) {
    console.error('[API Cron WhatsApp] Erro ao processar:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
