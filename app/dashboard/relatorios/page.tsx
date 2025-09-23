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
import { DataField } from "@/components/ui/data-display"
import { StatusBadge } from "@/components/ui/status-badge"
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Wrench, 
  DollarSign,
  BarChart3,
  Filter,
  Activity,
  Clock
} from "lucide-react"

export default function RelatoriosPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [status, setStatus] = useState("")

  const relatoriosDisponiveis = [
    {
      id: "financeiro",
      nome: "Relatório Financeiro",
      descricao: "Receitas, despesas e lucros por período",
      icon: DollarSign,
      categoria: "Financeiro"
    },
    {
      id: "ordens-servico",
      nome: "Ordens de Serviço",
      descricao: "Status e performance das ordens de serviço",
      icon: Wrench,
      categoria: "Operacional"
    },
    {
      id: "clientes",
      nome: "Relatório de Clientes",
      descricao: "Análise de clientes e histórico de serviços",
      icon: Users,
      categoria: "Comercial"
    },
    {
      id: "pecas",
      nome: "Estoque de Peças",
      descricao: "Movimentação e níveis de estoque",
      icon: BarChart3,
      categoria: "Estoque"
    },
    {
      id: "performance",
      nome: "Performance Geral",
      descricao: "Indicadores de performance e produtividade",
      icon: TrendingUp,
      categoria: "Gestão"
    }
  ]

  const relatoriosRecentes = [
    {
      nome: "Financeiro - Dezembro 2024",
      data: "15/01/2025",
      tipo: "Financeiro",
      status: "Concluído"
    },
    {
      nome: "Ordens de Serviço - Q4 2024",
      data: "10/01/2025",
      tipo: "Operacional",
      status: "Concluído"
    },
    {
      nome: "Clientes - Anual 2024",
      data: "05/01/2025",
      tipo: "Comercial",
      status: "Processando"
    }
  ]

  const gerarRelatorio = () => {
    if (!tipoRelatorio) {
      alert("Selecione um tipo de relatório")
      return
    }
    
    // Simular geração de relatório
    alert(`Gerando relatório: ${tipoRelatorio}\nPeríodo: ${dataInicio} a ${dataFim}`)
  }



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
              <p className="text-muted-foreground">
                Gere e visualize relatórios detalhados do seu negócio
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gerador de Relatórios */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Gerar Novo Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo-relatorio">Tipo de Relatório</Label>
                      <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {relatoriosDisponiveis.map((relatorio) => (
                            <SelectItem key={relatorio.id} value={relatorio.id}>
                              {relatorio.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status (Filtro)</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-inicio">Data Início</Label>
                      <Input
                        id="data-inicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-fim">Data Fim</Label>
                      <Input
                        id="data-fim"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={gerarRelatorio} className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </Button>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros Avançados
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tipos de Relatórios Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Relatórios Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatoriosDisponiveis.map((relatorio) => {
                      const IconComponent = relatorio.icon
                      return (
                        <div
                          key={relatorio.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setTipoRelatorio(relatorio.id)}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 text-blue-600 mt-1" />
                            <div className="flex-1">
                              <h4 className="font-medium">{relatorio.nome}</h4>
                              <p className="text-sm text-muted-foreground">
                                {relatorio.descricao}
                              </p>
                              <Badge variant="secondary" className="mt-2">
                                {relatorio.categoria}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar com Relatórios Recentes */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Relatórios Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatoriosRecentes.map((relatorio, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <h4 className="font-medium text-sm">{relatorio.nome}</h4>
                            <DataField
                              label="Data"
                              value={relatorio.data}
                              icon="calendar"
                              className="text-xs"
                            />
                            <StatusBadge 
                              status={relatorio.status === "Concluído" ? "success" : "processing"}
                              text={relatorio.status}
                              size="sm"
                            />
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <DataField
                      label="Relatórios este mês"
                      value="12"
                      icon="barChart3"
                    />
                    <DataField
                      label="Mais gerado"
                      value="Financeiro"
                      icon="trendingUp"
                    />
                    <DataField
                      label="Último acesso"
                      value="Hoje"
                      icon="clock"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Relatório Mensal
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Balanço Financeiro
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Top Clientes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}