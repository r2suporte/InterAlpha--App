'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Settings,
  ChevronDown,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// 📊 Interfaces para exportação
interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
}

interface ExportOptions {
  format: string;
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  includeFilters: boolean;
  customFields: string[];
  reportName: string;
  template: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  defaultFormat: string;
}

// 📋 Formatos de exportação disponíveis
const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    icon: FileText,
    description: 'Relatório formatado para apresentação',
    features: ['Gráficos', 'Formatação', 'Cabeçalhos', 'Rodapés'],
  },
  {
    id: 'excel',
    name: 'Excel',
    extension: '.xlsx',
    icon: FileSpreadsheet,
    description: 'Planilha com dados e gráficos',
    features: ['Múltiplas abas', 'Fórmulas', 'Gráficos', 'Filtros'],
  },
  {
    id: 'csv',
    name: 'CSV',
    extension: '.csv',
    icon: File,
    description: 'Dados brutos em formato tabular',
    features: ['Dados puros', 'Compatibilidade universal', 'Leve'],
  },
];

// 📄 Templates de relatório
const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive_summary',
    name: 'Resumo Executivo',
    description: 'Visão geral dos principais KPIs',
    sections: ['Métricas principais', 'Tendências', 'Comparações'],
    defaultFormat: 'pdf',
  },
  {
    id: 'financial_detailed',
    name: 'Financeiro Detalhado',
    description: 'Análise completa dos dados financeiros',
    sections: ['Receitas', 'Custos', 'Margens', 'Projeções'],
    defaultFormat: 'excel',
  },
  {
    id: 'operational_metrics',
    name: 'Métricas Operacionais',
    description: 'Indicadores de performance operacional',
    sections: ['Produtividade', 'Qualidade', 'Eficiência'],
    defaultFormat: 'excel',
  },
  {
    id: 'custom_report',
    name: 'Relatório Personalizado',
    description: 'Configure suas próprias seções',
    sections: ['Configurável'],
    defaultFormat: 'pdf',
  },
];

// 🎯 Campos disponíveis para customização
const AVAILABLE_FIELDS = [
  { id: 'revenue', label: 'Receita' },
  { id: 'profit', label: 'Lucro' },
  { id: 'customers', label: 'Clientes' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'conversion_rate', label: 'Taxa de Conversão' },
  { id: 'growth_rate', label: 'Taxa de Crescimento' },
  { id: 'satisfaction', label: 'Satisfação' },
  { id: 'retention', label: 'Retenção' },
];

// 🎨 Componente de seleção de formato
const FormatSelector: React.FC<{
  selectedFormat: string;
  onFormatChange: (_format: string) => void;
}> = ({ selectedFormat, onFormatChange }) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Formato de Exportação</Label>
      <div className="grid grid-cols-1 gap-3">
        {EXPORT_FORMATS.map((format) => {
          const Icon = format.icon;
          const isSelected = selectedFormat === format.id;
          
          return (
            <div
              key={format.id}
              className={`
                p-4 border rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
                }
              `}
              onClick={() => onFormatChange(format.id)}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{format.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {format.extension}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {format.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 📅 Componente de configuração de opções
const ExportOptionsPanel: React.FC<{
  options: ExportOptions;
  onOptionsChange: (_options: ExportOptions) => void;
}> = ({ options, onOptionsChange }) => {
  const updateOptions = (updates: Partial<ExportOptions>) => {
    onOptionsChange({ ...options, ...updates });
  };

  const toggleField = (fieldId: string) => {
    const newFields = options.customFields.includes(fieldId)
      ? options.customFields.filter(id => id !== fieldId)
      : [...options.customFields, fieldId];
    
    updateOptions({ customFields: newFields });
  };

  return (
    <div className="space-y-6">
      {/* Nome do relatório */}
      <div className="space-y-2">
        <Label htmlFor="report-name">Nome do Relatório</Label>
        <Input
          id="report-name"
          value={options.reportName}
          onChange={(e) => updateOptions({ reportName: e.target.value })}
          placeholder="Ex: Relatório Mensal - Janeiro 2024"
        />
      </div>

      {/* Template */}
      <div className="space-y-2">
        <Label>Template</Label>
        <Select
          value={options.template}
          onValueChange={(value) => updateOptions({ template: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TEMPLATES.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Período */}
      <div className="space-y-2">
        <Label>Período</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="start-date" className="text-xs">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={options.dateRange.start}
              onChange={(e) => updateOptions({
                dateRange: { ...options.dateRange, start: e.target.value }
              })}
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-xs">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={options.dateRange.end}
              onChange={(e) => updateOptions({
                dateRange: { ...options.dateRange, end: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      {/* Opções de conteúdo */}
      <div className="space-y-3">
        <Label>Conteúdo do Relatório</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-charts"
              checked={options.includeCharts}
              onCheckedChange={(checked) => 
                updateOptions({ includeCharts: Boolean(checked) })
              }
            />
            <Label htmlFor="include-charts" className="text-sm">
              Incluir gráficos e visualizações
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-raw-data"
              checked={options.includeRawData}
              onCheckedChange={(checked) => 
                updateOptions({ includeRawData: Boolean(checked) })
              }
            />
            <Label htmlFor="include-raw-data" className="text-sm">
              Incluir dados brutos
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-filters"
              checked={options.includeFilters}
              onCheckedChange={(checked) => 
                updateOptions({ includeFilters: Boolean(checked) })
              }
            />
            <Label htmlFor="include-filters" className="text-sm">
              Incluir filtros aplicados
            </Label>
          </div>
        </div>
      </div>

      {/* Campos personalizados */}
      <div className="space-y-3">
        <Label>Campos Personalizados</Label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_FIELDS.map((field) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Checkbox
                id={`field-${field.id}`}
                checked={options.customFields.includes(field.id)}
                onCheckedChange={() => toggleField(field.id)}
              />
              <Label htmlFor={`field-${field.id}`} className="text-sm">
                {field.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 📊 Componente principal de exportação
export const ReportExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
    includeRawData: false,
    includeFilters: true,
    customFields: ['revenue', 'profit', 'customers'],
    reportName: '',
    template: 'executive_summary',
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simular processo de exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui seria implementada a lógica real de exportação
      console.log('Exportando relatório:', exportOptions);
      
      // Simular download
      const filename = `${exportOptions.reportName || 'relatorio'}_${new Date().toISOString().split('T')[0]}${EXPORT_FORMATS.find(f => f.id === exportOptions.format)?.extension}`;
      
      // Em uma implementação real, aqui seria feito o download do arquivo
      alert(`Relatório "${filename}" exportado com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormat = EXPORT_FORMATS.find(f => f.id === exportOptions.format);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de formato */}
        <FormatSelector
          selectedFormat={exportOptions.format}
          onFormatChange={(format) => setExportOptions({ ...exportOptions, format })}
        />

        {/* Configurações avançadas */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurações Avançadas
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-96 overflow-y-auto">
            <ExportOptionsPanel
              options={exportOptions}
              onOptionsChange={setExportOptions}
            />
          </PopoverContent>
        </Popover>

        {/* Resumo da exportação */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Resumo da Exportação</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Formato: {selectedFormat?.name} ({selectedFormat?.extension})</div>
            <div>Template: {REPORT_TEMPLATES.find(t => t.id === exportOptions.template)?.name}</div>
            <div>
              Período: {exportOptions.dateRange.start} até {exportOptions.dateRange.end}
            </div>
            <div>Campos: {exportOptions.customFields.length} selecionados</div>
          </div>
        </div>

        {/* Botão de exportação */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || !exportOptions.reportName.trim()}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </>
          )}
        </Button>

        {!exportOptions.reportName.trim() && (
          <p className="text-sm text-muted-foreground text-center">
            Digite um nome para o relatório para continuar
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportExport;