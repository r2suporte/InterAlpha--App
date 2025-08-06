import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Inicialização das integrações (apenas uma vez)
let integrationsInitialized = false;

export async function middleware(request: NextRequest) {
  // Inicializar integrações apenas uma vez
  if (!integrationsInitialized && process.env.NODE_ENV !== 'development') {
    try {
      const { initializeIntegrations } = await import('./lib/integrations/init');
      await initializeIntegrations();
      integrationsInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar integrações no middleware:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};