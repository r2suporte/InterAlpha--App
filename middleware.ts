import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'

// Função para tratar autenticação do portal do cliente
async function handleClientPortalAuth(request: NextRequest) {
  const clienteToken = request.cookies.get('cliente-token')?.value
  
  // Rotas protegidas do portal do cliente
  const protectedClientRoutes = ['/portal/cliente/dashboard', '/portal/cliente/ordem']
  const isProtectedClientRoute = protectedClientRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Se é uma rota protegida, verificar autenticação
  if (isProtectedClientRoute) {
    if (!clienteToken) {
      // Redirecionar para login do cliente se não tem token
      const url = request.nextUrl.clone()
      url.pathname = '/portal/cliente/login'
      return NextResponse.redirect(url)
    }
    
    try {
      // Verificar se o token é válido
      const decoded = verify(clienteToken, process.env.JWT_SECRET || 'fallback-secret')
      if (!decoded || (decoded as any).tipo !== 'cliente') {
        // Token inválido, redirecionar para login
        const url = request.nextUrl.clone()
        url.pathname = '/portal/cliente/login'
        const response = NextResponse.redirect(url)
        response.cookies.delete('cliente-token')
        return response
      }
    } catch (error) {
      // Token inválido, redirecionar para login
      const url = request.nextUrl.clone()
      url.pathname = '/portal/cliente/login'
      const response = NextResponse.redirect(url)
      response.cookies.delete('cliente-token')
      return response
    }
  }
  
  // Se já está autenticado e tentando acessar login, redirecionar para dashboard
  if (clienteToken && request.nextUrl.pathname === '/portal/cliente/login') {
    try {
      const decoded = verify(clienteToken, process.env.JWT_SECRET || 'fallback-secret')
      if (decoded && (decoded as any).tipo === 'cliente') {
        const url = request.nextUrl.clone()
        url.pathname = '/portal/cliente/dashboard'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Token inválido, permitir acesso ao login
    }
  }
  
  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Verificar se é uma rota do portal do cliente
  const isClientPortalRoute = request.nextUrl.pathname.startsWith('/portal/cliente')
  
  if (isClientPortalRoute) {
    return handleClientPortalAuth(request)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rotas protegidas - adicione aqui as rotas que precisam de autenticação
  const protectedRoutes = ['/dashboard', '/profile', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirecionar para login se não autenticado em rota protegida
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirecionar para dashboard se já autenticado tentando acessar login/registro
  if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}