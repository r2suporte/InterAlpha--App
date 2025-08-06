'use client';

import { useState } from 'react';
import { Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AnalyticsFilters } from '@/services/analytics/analytics-service';

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function AnalyticsFilters({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  loading = false,
}: AnalyticsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const date = new Date(value);
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date,
      },
    });
  };

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (range) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      dateRange: { start, end },
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Linha principal de filtros */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Período rápido */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Select onValueChange={handleQuickDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="thisYear">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Datas personalizadas */}
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-sm">De:</Label>
              <Input
                id="startDate"
                type="date"
                value={formatDateForInput(filters.dateRange.start)}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-sm">Até:</Label>
              <Input
                id="endDate"
                type="date"
                value={formatDateForInput(filters.dateRange.end)}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-36"
              />
            </div>

            {/* Botão de filtros avançados */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>

            {/* Botão de atualizar */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {/* Botões de exportação */}
            {onExport && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport('excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            )}
          </div>

          {/* Filtros avançados */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="clientId" className="text-sm font-medium">
                  Cliente ID
                </Label>
                <Input
                  id="clientId"
                  placeholder="ID do cliente"
                  value={filters.clientId || ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      clientId: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status da Ordem
                </Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      status: value || undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod" className="text-sm font-medium">
                  Método de Pagamento
                </Label>
                <Select
                  value={filters.paymentMethod || ''}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      paymentMethod: value || undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os métodos</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                    <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}