import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { EmployeeRole, hasRouteAccess } from '@/lib/auth/permissions'

// Rotas que requerem autenticação
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/clientes(.*)',
  '/ordens-servico(.*)',
  '/produtos(.*)',
  '/pagamentos(.*)',
  '/relatorios(.*)',
  '/admin(.*)',
  '/auditoria(.*)'
])

// Rotas públicas (não requerem autenticação)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/client/login',
  '/api/auth/client(.*)',
  '/api/validate(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = auth()
  const { pathname } = req.nextUrl

  // Permitir rotas públicas
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Verificar autenticação para rotas protegidas
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Se usuário está autenticado, verificar permissões
  if (userId && isProtectedRoute(req)) {
    try {
      // Obter role do usuário (pode vir do sessionClaims ou metadata)
      const userRole = sessionClaims?.metadata?.role as EmployeeRole
      
      if (userRole) {
        // Verificar se o role tem acesso à rota
        const hasAccess = hasRouteAccess(userRole, pathname)
        
        if (!hasAccess) {
          // Redirecionar para página de acesso negado ou dashboard
          return NextResponse.redirect(new URL('/dashboard?error=access-denied', req.url))
        }
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      // Em caso de erro, permitir acesso mas logar o erro
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}