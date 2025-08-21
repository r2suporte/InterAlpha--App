'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Key, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ClientLoginPage() {
  const [accessKey, setAccessKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se há erro nos parâmetros da URL
    const urlError = searchParams.get('error')
    if (urlError) {
      switch (urlError) {
        case 'invalid_key':
          setError('Chave de acesso inválida')
          break
        case 'expired_key':
          setError('Chave de acesso expirada')
          break
        case 'validation_error':
          setError('Erro na validação. Tente novamente.')
          break
        default:
          setError('Erro desconhecido')
      }
    }

    // Verificar se há chave nos parâmetros da URL
    const urlKey = searchParams.get('key')
    if (urlKey) {
      setAccessKey(urlKey)
      handleLogin(urlKey)
    }
  }, [searchParams])

  const handleLogin = async (keyToValidate?: string) => {
    const key = keyToValidate || accessKey.trim()
    
    if (!key) {
      setError('Por favor, insira sua chave de acesso')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/client/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        // Salvar dados da sessão
        localStorage.setItem('client_key', key)
        localStorage.setItem('client_session', JSON.stringify(data.session))
        
        // Redirecionar para o dashboard do cliente
        router.push('/client/dashboard')
      } else {
        setError(data.error || 'Chave de acesso inválida')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Portal do Cliente
          </h1>
          <p className="text-gray-600 mt-2">Acesse com sua chave temporária</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Acesso Seguro
            </CardTitle>
            <CardDescription>
              Insira sua chave de acesso de 24 horas
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Chave de Acesso
                </label>
                <Input
                  id="accessKey"
                  type="text"
                  placeholder="Digite sua chave de acesso"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  disabled={loading}
                  className="text-center font-mono text-lg"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl border-0" 
                disabled={loading || !accessKey.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Acessar Portal
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request New Key */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Não possui uma chave de acesso?
          </p>
          <Link href="/client/request-access">
            <Button variant="outline" className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Solicitar Nova Chave
            </Button>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="bg-green-50/50 border-green-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Acesso Seguro</p>
                  <p className="text-xs text-green-600">Chaves temporárias com criptografia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Validade 24h</p>
                  <p className="text-xs text-blue-600">Chaves expiram automaticamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Keys */}
        <Card className="bg-yellow-50/50 border-yellow-200/50">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Key className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  Chaves de Demonstração
                </p>
              </div>
              <div className="space-y-2">
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  DEMO-CLIENT-2024
                </div>
                <div className="bg-white p-2 rounded border font-mono text-xs">
                  TEST-KEY-123456
                </div>
              </div>
              <p className="text-xs text-yellow-600">
                Use uma das chaves acima para testar o sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Problemas com o acesso?{' '}
            <Link href="/contato" className="text-blue-600 hover:underline">
              Entre em contato
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}