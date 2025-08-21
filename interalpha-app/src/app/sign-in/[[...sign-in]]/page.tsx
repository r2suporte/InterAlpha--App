'use client'

import { SignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [clerkError, setClerkError] = useState<string | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [fallbackForm, setFallbackForm] = useState({ email: '', password: '' })

  useEffect(() => {
    console.log('🔍 [CLERK DEBUG] Componente SignIn montando...')
    setMounted(true)
    
    // Debug info detalhado
    const debug = {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      origin: window.location.origin
    }
    
    console.log('🔍 [CLERK DEBUG] Variáveis de ambiente:', debug)
    setDebugInfo(debug)

    // Verificar se o Clerk está carregando corretamente
    const checkClerkLoading = setTimeout(() => {
      const clerkElements = document.querySelectorAll('[data-clerk-element]')
      const clerkInputs = document.querySelectorAll('input[name="identifier"], input[name="password"]')
      
      console.log('🔍 [CLERK DEBUG] Elementos Clerk encontrados:', clerkElements.length)
      console.log('🔍 [CLERK DEBUG] Inputs de login encontrados:', clerkInputs.length)
      
      if (clerkElements.length === 0 && clerkInputs.length === 0) {
        console.log('❌ [CLERK DEBUG] Clerk não carregou corretamente')
        setClerkError('Clerk não carregou os campos de login')
        setShowFallback(true)
      } else {
        console.log('✅ [CLERK DEBUG] Clerk carregou corretamente')
      }
    }, 3000)

    return () => clearTimeout(checkClerkLoading)
  }, [])

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 [FALLBACK] Tentativa de login manual:', { email: fallbackForm.email })
    
    // Aqui você pode implementar uma autenticação alternativa
    alert('Sistema de fallback ativado. Entre em contato com o suporte.')
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">IA</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema InterAlpha
          </h1>
          <p className="text-gray-600">
            Acesso para funcionários autorizados
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Mostrar erro do Clerk se houver */}
          {clerkError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">
                ⚠️ Problema detectado: {clerkError}
              </p>
            </div>
          )}

          {/* Componente Clerk principal */}
          {!showFallback && (
            <div id="clerk-signin-container">
              <SignIn 
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                afterSignInUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary: 
                      'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm normal-case',
                    card: 'shadow-none',
                    headerTitle: 'text-xl font-semibold text-gray-900',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50',
                    formFieldInput: 'border-gray-200 focus:border-blue-500',
                    footerActionLink: 'text-blue-600 hover:text-blue-700',
                    rootBox: 'w-full',
                    cardBox: 'w-full shadow-none',
                    main: 'w-full'
                  },
                  layout: {
                    socialButtonsPlacement: 'bottom',
                    showOptionalFields: true
                  }
                }}
              />
            </div>
          )}

          {/* Sistema de Fallback Manual */}
          {showFallback && (
            <div id="fallback-login-form">
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  🔧 Sistema de login alternativo ativado
                </p>
              </div>
              
              <form onSubmit={handleFallbackSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={fallbackForm.email}
                    onChange={(e) => setFallbackForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={fallbackForm.password}
                    onChange={(e) => setFallbackForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Entrar (Modo Fallback)
                </button>
              </form>
              
              <button
                onClick={() => {
                  setShowFallback(false)
                  setClerkError(null)
                  window.location.reload()
                }}
                className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Tentar novamente com Clerk
              </button>
            </div>
          )}

          {/* Botão manual para ativar fallback */}
          {!showFallback && !clerkError && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFallback(true)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Campos não aparecem? Clique aqui
              </button>
            </div>
          )}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Problemas com o acesso?{' '}
            <a href="/contato" className="text-blue-600 hover:underline">
              Entre em contato
            </a>
          </p>
        </div>

        {/* Debug info expandido - remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Debug Info (Fase 3):</h3>
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>
                <span className={clerkError ? 'text-red-600' : 'text-green-600'}>
                  {clerkError ? ' ❌ Erro detectado' : ' ✅ OK'}
                </span>
              </div>
              <div>
                <strong>Fallback:</strong>
                <span className={showFallback ? 'text-yellow-600' : 'text-blue-600'}>
                  {showFallback ? ' 🔧 Ativo' : ' 💤 Inativo'}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer font-bold">Detalhes técnicos</summary>
                <pre className="text-gray-600 overflow-x-auto mt-2 p-2 bg-white rounded">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}