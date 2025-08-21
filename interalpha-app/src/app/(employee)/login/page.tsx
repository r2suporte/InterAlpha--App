'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/employee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim(),
          password: password.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Salvar token e dados do funcionário
        localStorage.setItem('employee_token', data.token)
        localStorage.setItem('employee_data', JSON.stringify(data.employee))
        
        toast.success('Login realizado com sucesso!')
        
        // Redirecionar baseado no role
        const redirectPath = getRedirectPath(data.employee.role)
        router.push(redirectPath)
      } else {
        setError(data.error || 'Credenciais inválidas')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'ATENDENTE':
        return '/employee/atendente/dashboard'
      case 'TECNICO':
        return '/employee/tecnico/dashboard'
      case 'SUPERVISOR_TECNICO':
        return '/employee/supervisor/dashboard'
      case 'GERENTE_ADM':
        return '/employee/admin/dashboard'
      case 'GERENTE_FINANCEIRO':
        return '/employee/financeiro/dashboard'
      default:
        return '/employee/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal dos Funcionários</h1>
          <p className="text-gray-600 mt-2">Acesse o sistema com suas credenciais</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Login Seguro
            </CardTitle>
            <CardDescription>
              Entre com seu email e senha corporativa
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Acesso Seguro</h3>
                  <p className="text-sm text-blue-700">
                    Todas as ações são registradas e auditadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Baseado em Roles</h3>
                  <p className="text-sm text-green-700">
                    Interface personalizada para seu cargo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Problemas para acessar?
          </p>
          <Button 
            variant="ghost" 
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => toast.info('Entre em contato com o administrador do sistema')}
          >
            Contatar Suporte
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© 2024 InterAlpha. Sistema Interno.</p>
          <p className="mt-1">
            Acesso restrito a funcionários autorizados
          </p>
        </div>
      </div>
    </div>
  )
}