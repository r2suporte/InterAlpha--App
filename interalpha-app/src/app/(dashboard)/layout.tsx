'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { Loader2 } from 'lucide-react'

// Componente de loading durante verificação de autenticação
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-white font-bold text-2xl">IA</span>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse"></div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
          InterAlpha
        </h2>
        <div className="flex items-center justify-center space-x-3 text-gray-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-gray-500 mt-4">Verificando autenticação...</p>
      </div>
    </div>
  )
}

// Componente de redirecionamento
function RedirectingScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-white font-bold text-2xl">🔒</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Restrito</h2>
        <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta área</p>
        <div className="flex items-center justify-center space-x-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Redirecionando para o login...</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const { theme } = useTheme()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setIsRedirecting(true)
      // Pequeno delay para melhor UX
      setTimeout(() => {
        router.push('/sign-in')
      }, 1000)
    }
  }, [isLoaded, isSignedIn, router])

  // Mostrar loading enquanto o Clerk carrega
  if (!isLoaded) {
    return <AuthLoadingScreen />
  }

  // Mostrar tela de redirecionamento se não estiver logado
  if (!isSignedIn || isRedirecting) {
    return <RedirectingScreen />
  }

  // Usuário autenticado - mostrar dashboard
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50/50 text-gray-900'}`}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="relative">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-50/20 to-pink-50/20 rounded-full blur-3xl -z-10"></div>
              
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}