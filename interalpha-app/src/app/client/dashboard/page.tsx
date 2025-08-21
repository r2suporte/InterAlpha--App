'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  FileText, 
  CreditCard, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react'

interface ClientSession {
  clientId: string
  clientData: {
    id: string
    name: string
    email: string
    phone: string
  }
  expiresAt: string
  keyId: string
}

export default function ClientDashboardPage() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar sessão do cliente
    const clientKey = localStorage.getItem('client_key')
    const clientSession = localStorage.getItem('client_session')

    if (!clientKey || !clientSession) {
      router.push('/client/login')
      return
    }

    try {
      const sessionData = JSON.parse(clientSession)
      setSession(sessionData)
      
      // Carregar dados do cliente
      loadClientData(sessionData.clientId, clientKey)
    } catch (error) {
      console.error('Erro ao carregar sessão:', error)
      handleLogout()
    }
  }, [router])

  const loadClientData = async (clientId: string, key: string) => {
    try {
      setLoading(true)

      // Carregar pedidos
      const ordersResponse = await fetch(`/api/client/orders?clientId=${clientId}`, {
        headers: {
          'x-client-key': key
        }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setOrders(ordersData.orders || [])
      }

      // Carregar pagamentos
      const paymentsResponse = await fetch(`/api/client/payments?clientId=${clientId}`, {
        headers: {
          'x-client-key': key
        }
      })

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData.payments || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('client_key')
    localStorage.removeItem('client_session')
    router.push('/client/login')
  }

  const getTimeRemaining = () => {
    if (!session) return ''
    
    const expiresAt = new Date(session.expiresAt)
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expirado'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m restantes`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal do Cliente</h1>
                <p className="text-sm text-gray-600">Bem-vindo, {session.clientData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {getTimeRemaining()}
                </p>
                <p className="text-xs text-gray-500">Sessão expira</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle>{session.clientData.name}</CardTitle>
                <CardDescription>Cliente InterAlpha</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{session.clientData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Telefone:</span>
                    <span className="font-medium">{session.clientData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">ID:</span>
                    <span className="font-mono text-xs">{session.clientData.id}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status da Sessão:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ativa
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders and Payments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Orders */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Ordens de Serviço
                </CardTitle>
                <CardDescription>
                  Acompanhe o status dos seus serviços
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <div>
                          <p className="font-medium">{order.title}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          {order.value && (
                            <p className="text-sm text-gray-600 mt-1">
                              R$ {order.value.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma ordem de serviço encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Pagamentos
                </CardTitle>
                <CardDescription>
                  Histórico de pagamentos e faturas
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg">
                        <div>
                          <p className="font-medium">Pagamento #{payment.id}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(payment.status)}
                          <p className="text-sm font-medium text-green-600 mt-1 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            R$ {payment.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum pagamento encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Funcionalidades disponíveis para você
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  <span>Chat Suporte</span>
                  <span className="text-xs text-gray-500">Fale conosco</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span>Documentos</span>
                  <span className="text-xs text-gray-500">Baixar arquivos</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <span>Reportar Problema</span>
                  <span className="text-xs text-gray-500">Abrir chamado</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}