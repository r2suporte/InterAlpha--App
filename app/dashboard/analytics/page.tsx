'use client';

import React, { useState } from 'react';

import {
  BarChart3,
  TrendingUp,
  Filter,
  Download,
  Calendar,
  Settings,
  RefreshCw,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveText,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 📊 Importar componentes analytics
import { ExecutiveDashboard } from '@/components/analytics/executive-dashboard';
import { AdvancedFilters } from '@/components/analytics/advanced-filters';
import { ReportExport } from '@/components/analytics/report-export';

// 🎯 Interfaces para filtros (importadas do componente)
interface ActiveFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

interface ComparisonPeriod {
  id: string;
  label: string;
  value: string;
  description: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isMobile } = useBreakpoint();
  
  // 📊 Estados para filtros e dados
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [comparison, setComparison] = useState<ComparisonPeriod | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🔄 Função para atualizar dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular carregamento de dados
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // 📈 Função para aplicar filtros
  const handleFiltersChange = (newFilters: ActiveFilter[]) => {
    setActiveFilters(newFilters);
    // Aqui seria implementada a lógica para aplicar os filtros aos dados
    console.log('Filtros aplicados:', newFilters);
  };

  // 📊 Função para mudança de comparação
  const handleComparisonChange = (newComparison: ComparisonPeriod | null) => {
    setComparison(newComparison);
    console.log('Comparação alterada:', newComparison);
  };

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer className="flex min-h-screen flex-1 flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30">
          <div className="@container/main flex flex-1 flex-col">
            {/* Header Section */}
            <div className="border-b border-slate-200/60 bg-white/50 px-4 py-6 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/50 lg:px-6">
              <ResponsiveStack
                direction="responsive"
                align="center"
                className="space-y-4 sm:space-y-0"
              >
                <div className="flex items-center space-x-4">
                  <BackButton href="/dashboard" />
                  
                  <div className="space-y-1">
                    <ResponsiveText
                      size={isMobile ? '2xl' : '3xl'}
                      className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text font-bold tracking-tight text-transparent dark:from-slate-100 dark:to-slate-300"
                    >
                      Analytics Avançado
                    </ResponsiveText>
                    <ResponsiveText
                      size={isMobile ? 'sm' : 'base'}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      Análise detalhada e insights de performance
                    </ResponsiveText>
                  </div>
                </div>

                <ShowHide hide={['sm']}>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-700"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Período
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 dark:border-slate-700"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Button>
                  </div>
                </ShowHide>
              </ResponsiveStack>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col gap-6 py-6">
              <div className="px-4 lg:px-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Dashboard Executivo */}
                  <TabsContent value="dashboard" className="mt-6">
                    <div className="space-y-6">
                      <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Dashboard Executivo
                          </CardTitle>
                          <CardDescription>
                            Visão geral dos principais indicadores de performance
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ExecutiveDashboard />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Filtros Avançados */}
                  <TabsContent value="filters" className="mt-6">
                    <div className="space-y-6">
                      <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filtros Avançados
                          </CardTitle>
                          <CardDescription>
                            Configure filtros personalizados e comparações temporais
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <AdvancedFilters
                            onFiltersChange={handleFiltersChange}
                            onComparisonChange={handleComparisonChange}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Exportação de Relatórios */}
                  <TabsContent value="export" className="mt-6">
                    <div className="space-y-6">
                      <Card className="border-0 bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-900/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Exportação de Relatórios
                          </CardTitle>
                          <CardDescription>
                            Exporte relatórios personalizados em múltiplos formatos
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ReportExport />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Informações adicionais */}
              <div className="px-4 lg:px-6">
                <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                        <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                          Dicas para Análise Eficaz
                        </h3>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          Use os filtros avançados para segmentar seus dados e obter insights mais precisos. 
                          Compare períodos diferentes para identificar tendências e padrões de performance.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            Filtros Personalizados
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            Comparação Temporal
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            Exportação Flexível
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}