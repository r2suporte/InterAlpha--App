'use client';

import { useState } from 'react';

import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  TrendingUp,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataField } from '@/components/ui/data-display';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveText,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { StatusBadge } from '@/components/ui/status-badge';

export default function RelatoriosPage() {
  const { isMobile, isTablet } = useBreakpoint();
  const [tipoRelatorio, setTipoRelatorio] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState('');
  const [filtrosAvancadosOpen, setFiltrosAvancadosOpen] = useState(false);
  const [incluirGraficos, setIncluirGraficos] = useState(true);
  const [incluirDetalhes, setIncluirDetalhes] = useState(true);
  const [formatoExportacao, setFormatoExportacao] = useState('pdf');
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const relatoriosDisponiveis = [
    {
      id: 'financeiro',
      nome: 'Relatório Financeiro',
      descricao: 'Receitas, despesas e lucros por período',
      icon: DollarSign,
      categoria: 'Financeiro',
    },
    {
      id: 'ordens-servico',
      nome: 'Ordens de Serviço',
      descricao: 'Status e performance das ordens de serviço',
      icon: Wrench,
      categoria: 'Operacional',
    },
    {
      id: 'clientes',
      nome: 'Relatório de Clientes',
      descricao: 'Análise de clientes e histórico de serviços',
      icon: Users,
      categoria: 'Comercial',
    },
    {
      id: 'pecas',
      nome: 'Estoque de Peças',
      descricao: 'Movimentação e níveis de estoque',
      icon: BarChart3,
      categoria: 'Estoque',
    },
    {
      id: 'performance',
      nome: 'Performance Geral',
      descricao: 'Indicadores de performance e produtividade',
      icon: TrendingUp,
      categoria: 'Gestão',
    },
  ];

  const relatoriosRecentes = [
    {
      nome: 'Financeiro - Dezembro 2024',
      data: '15/01/2025',
      tipo: 'Financeiro',
      status: 'Concluído',
    },
    {
      nome: 'Ordens de Serviço - Q4 2024',
      data: '10/01/2025',
      tipo: 'Operacional',
      status: 'Concluído',
    },
    {
      nome: 'Clientes - Anual 2024',
      data: '05/01/2025',
      tipo: 'Comercial',
      status: 'Processando',
    },
  ];

  const gerarRelatorio = async () => {
    if (!tipoRelatorio) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    if (!dataInicio || !dataFim) {
      toast.error('Selecione o período do relatório');
      return;
    }

    setGerandoRelatorio(true);

    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));

      const relatorioSelecionado = relatoriosDisponiveis.find(
        r => r.id === tipoRelatorio
      );
      toast.success(
        `Relatório "${relatorioSelecionado?.nome}" gerado com sucesso!`
      );

      // Simular download do arquivo
      const blob = new Blob(
        [
          `Relatório: ${relatorioSelecionado?.nome}\nPeríodo: ${dataInicio} a ${dataFim}\nStatus: ${status || 'Todos'}\nFormato: ${formatoExportacao.toUpperCase()}`,
        ],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${tipoRelatorio}-${dataInicio}-${dataFim}.${formatoExportacao}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const downloadRelatorio = (nomeRelatorio: string) => {
    toast.success(`Baixando ${nomeRelatorio}...`);
    // Simular download
    const blob = new Blob([`Conteúdo do relatório: ${nomeRelatorio}`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeRelatorio.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gerarRelatorioRapido = async (tipo: string) => {
    setGerandoRelatorio(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Relatório ${tipo} gerado com sucesso!`);

      // Simular download
      const blob = new Blob(
        [`Relatório ${tipo} - ${new Date().toLocaleDateString()}`],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tipo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer className="flex-1 space-y-6 p-4 pt-6 md:p-8">
          {/* Header */}
          <ResponsiveStack
            direction={isMobile ? 'vertical' : 'horizontal'}
            className="space-y-4 md:items-center md:justify-between md:space-y-0"
          >
            <div className="flex items-center gap-4">
              <BackButton href="/dashboard" />
              <div>
                <ResponsiveText
                  size={isMobile ? '2xl' : '3xl'}
                  className="font-bold tracking-tight"
                >
                  Relatórios
                </ResponsiveText>
                <ResponsiveText
                  size={isMobile ? 'sm' : 'base'}
                  className="text-muted-foreground"
                >
                  Gere e visualize relatórios detalhados do seu negócio
                </ResponsiveText>
              </div>
            </div>
          </ResponsiveStack>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gerador de Relatórios */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Gerar Novo Relatório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tipo-relatorio">Tipo de Relatório</Label>
                      <Select
                        value={tipoRelatorio}
                        onValueChange={setTipoRelatorio}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {relatoriosDisponiveis.map(relatorio => (
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
                        onChange={e => setDataInicio(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data-fim">Data Fim</Label>
                      <Input
                        id="data-fim"
                        type="date"
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={gerarRelatorio}
                      className="flex-1"
                      disabled={gerandoRelatorio}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {gerandoRelatorio ? 'Gerando...' : 'Gerar Relatório'}
                    </Button>
                    <Dialog
                      open={filtrosAvancadosOpen}
                      onOpenChange={setFiltrosAvancadosOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Filter className="mr-2 h-4 w-4" />
                          Filtros Avançados
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Filtros Avançados</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Formato de Exportação</Label>
                            <Select
                              value={formatoExportacao}
                              onValueChange={setFormatoExportacao}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="xlsx">Excel</SelectItem>
                                <SelectItem value="csv">CSV</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <Label>Opções de Conteúdo</Label>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="graficos"
                                checked={incluirGraficos}
                                onCheckedChange={(v) => setIncluirGraficos(Boolean(v))}
                              />
                              <Label htmlFor="graficos">Incluir gráficos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="detalhes"
                                checked={incluirDetalhes}
                                onCheckedChange={(v) => setIncluirDetalhes(Boolean(v))}
                              />
                              <Label htmlFor="detalhes">Incluir detalhes</Label>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setFiltrosAvancadosOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => setFiltrosAvancadosOpen(false)}
                            >
                              Aplicar Filtros
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Tipos de Relatórios Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Relatórios Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {relatoriosDisponiveis.map(relatorio => {
                      const IconComponent = relatorio.icon;
                      return (
                        <div
                          key={relatorio.id}
                          className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
                          onClick={() => setTipoRelatorio(relatorio.id)}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="mt-1 h-5 w-5 text-blue-600" />
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
                      );
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
                      <div key={index} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <h4 className="text-sm font-medium">
                              {relatorio.nome}
                            </h4>
                            <DataField
                              label="Data"
                              value={relatorio.data}
                              icon="calendar"
                              className="text-xs"
                            />
                            <StatusBadge
                              status={
                                relatorio.status === 'Concluído'
                                  ? 'success'
                                  : 'processing'
                              }
                              text={relatorio.status}
                              size="sm"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadRelatorio(relatorio.nome)}
                            disabled={gerandoRelatorio}
                          >
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
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => gerarRelatorioRapido('Relatório Mensal')}
                    disabled={gerandoRelatorio}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Relatório Mensal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => gerarRelatorioRapido('Balanço Financeiro')}
                    disabled={gerandoRelatorio}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Balanço Financeiro
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => gerarRelatorioRapido('Top Clientes')}
                    disabled={gerandoRelatorio}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Top Clientes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
