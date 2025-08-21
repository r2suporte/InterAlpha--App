'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Mail, Phone, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function RequestAccessPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [document, setDocument] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('email')
  const router = useRouter()

  const handleRequestByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !document.trim()) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/client/request-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim(),
          document: document.trim(),
          method: 'email'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Chave de acesso enviada por email!')
      } else {
        setError(data.error || 'Erro ao solicitar chave de acesso')
      }
    } catch (error) {
      console.error('Erro na solicitação:', error)
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestBySMS = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone.trim() || !document.trim()) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/client/request-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phone: phone.trim(),
          document: document.trim(),
          method: 'sms'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Chave de acesso enviada por SMS!')
      } else {
        setError(data.error || 'Erro ao solicitar chave de acesso')
      }
    } catch (error) {
      console.error('Erro na solicitação:', error)
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara (11) 99999-9999
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    
    return value
  }

  const formatDocument = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara CPF ou CNPJ
    if (numbers.length <= 11) {
      // CPF: 999.999.999-99
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 99.999.999/9999-99
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Chave Enviada!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua chave de acesso foi enviada com sucesso. 
              Verifique seu {activeTab === 'email' ? 'email' : 'SMS'} e use a chave para acessar o portal.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/client/login')}
                className="w-full"
              >
                Fazer Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSuccess(false)}
                className="w-full"
              >
                Solicitar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Solicitar Acesso</h1>
          <p className="text-gray-600 mt-2">Receba sua chave de acesso temporária</p>
        </div>

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Chave de Acesso</CardTitle>
            <CardDescription>
              Escolha como deseja receber sua chave de acesso
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <form onSubmit={handleRequestByEmail} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="document-email" className="block text-sm font-medium text-gray-700 mb-2">
                      CPF/CNPJ
                    </label>
                    <Input
                      id="document-email"
                      type="text"
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={(e) => setDocument(formatDocument(e.target.value))}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !email.trim() || !document.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar por Email
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="sms" className="space-y-4 mt-4">
                <form onSubmit={handleRequestBySMS} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="document-sms" className="block text-sm font-medium text-gray-700 mb-2">
                      CPF/CNPJ
                    </label>
                    <Input
                      id="document-sms"
                      type="text"
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={(e) => setDocument(formatDocument(e.target.value))}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !phone.trim() || !document.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Enviar por SMS
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/client/login')}
            className="text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>

        {/* Info */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Use o mesmo email ou telefone cadastrado em nosso sistema. 
              A chave de acesso expira em 24 horas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}