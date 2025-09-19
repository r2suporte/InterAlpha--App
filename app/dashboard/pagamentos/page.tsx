"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  Eye
} from "lucide-react"

export default function PagamentosPage() {
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroMetodo, setFiltroMetodo] = useState("")
  const [busca, setBusca] = useState("")

  const pagamentos = [
    {
      id: "PAG-001",
      cliente: "João Silva",
      valor: 1250.00,
      metodo: "Cartão de Crédito",
      status: "Aprovado",
      data: "15/01/2025",
      ordemServico: "OS-001"
    },
    {
      id: "PAG-002",
      cliente: "Maria Santos",
      valor: 850.00,
      metodo: "PIX",
      status: "Pendente",
      data: "14/01/2025",
      ordemServico: "OS-002"
    },
    {
      id: "PAG-003",
      cliente: "Carlos Oliveira",
      valor: 2100.00,
      metodo: "Boleto",
      status: "Processando",
      data: "13/01/2025",
      ordemServico: "OS-003"
    },
    {
      id: "PAG-004",
      cliente: "Ana Costa",
      valor: 450.00,
      metodo: "Débito",
      status: "Rejeitado",
      data: "12/01/2025",
      ordemServico: "OS-004"
    },
    {
      id: "PAG-005",
      cliente: "Pedro Lima",
      valor: 1800.00,
      metodo: "Transferência",
      status: "Aprovado",
      data: "11/01/2025",
      ordemServico: "OS-005"
    }
  ]

  const estatisticas = {
    totalRecebido: 15750.00,
    totalPendente: 3200.00,
    totalMes: 18950.00,
    transacoes: 45
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-green-100 text-green-800"
      case "Pendente":
        return "bg-yellow-100 text-yellow-800"
      case "Processando":
        return "bg-blue-100 text-blue-800"
      case "Rejeitado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Aprovado":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Pendente":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "Processando":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "Rejeitado":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchStatus = !filtroStatus || filtroStatus === "todos" || pagamento.status === filtroStatus
    const matchMetodo = !filtroMetodo || filtroMetodo === "todos" || pagamento.metodo === filtroMetodo
    const matchBusca = !busca || 
      pagamento.cliente.toLowerCase().includes(busca.toLowerCase()) ||
      pagamento.id.toLowerCase().includes(busca.toLowerCase())
    
    return matchStatus && matchMetodo && matchBusca
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Pagamentos</h2>
              <p className="text-muted-foreground">
                Gerencie e monitore todos os pagamentos da sua empresa
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {estatisticas.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  R$ {estatisticas.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {estatisticas.totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">Janeiro 2025</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transações</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.transacoes}</div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="busca">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="busca"
                      placeholder="Cliente ou ID..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Processando">Processando</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Método</Label>
                  <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os métodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ações</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentosFiltrados.map((pagamento) => (
                  <div key={pagamento.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(pagamento.status)}
                        <div>
                          <p className="font-medium">{pagamento.cliente}</p>
                          <p className="text-sm text-muted-foreground">
                            {pagamento.id} • {pagamento.ordemServico}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {pagamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">{pagamento.metodo}</p>
                      </div>

                      <div className="text-right">
                        <Badge className={getStatusColor(pagamento.status)}>
                          {pagamento.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">{pagamento.data}</p>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {pagamentosFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum pagamento encontrado com os filtros aplicados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}