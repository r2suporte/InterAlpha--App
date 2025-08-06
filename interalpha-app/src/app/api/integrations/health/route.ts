import { NextResponse } from 'next/server';
import { checkIntegrationsHealth } from '@/lib/integrations';

export async function GET() {
  try {
    const health = await checkIntegrationsHealth();
    
    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Erro ao verificar saúde das integrações',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}