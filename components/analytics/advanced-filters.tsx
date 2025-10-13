'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  X,
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
// import { DateRangeFilter } from '@/components/ui/search-filter';
import { cn } from '@/lib/utils';

// 🔍 Interfaces para filtros
interface FilterOption {
  id: string;
  label: string;
  value: string | number;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'range' | 'date' | 'boolean';
  options?: { label: string; value: string | number }[];
  min?: number;
  max?: number;
}

interface ActiveFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

interface FilterGroup {
  id: string;
  name: string;
  filters: FilterOption[];
  icon: React.ComponentType<{ className?: string }>;
}

interface ComparisonPeriod {
  id: string;
  label: string;
  value: string;
  description: string;
}

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  filters: ActiveFilter[];
  createdAt: Date;
  isPublic: boolean;
}

// 📊 Configurações de filtros
const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'financial',
    name: 'Financeiro',
    icon: DollarSign,
    filters: [
      {
        id: 'revenue',
        label: 'Receita',
        value: '',
        type: 'range',
        min: 0,
        max: 10000000,
      },
      {
        id: 'profit_margin',
        label: 'Margem de Lucro',
        value: '',
        type: 'range',
        min: 0,
        max: 100,
      },
      {
        id: 'currency',
        label: 'Moeda',
        value: '',
        type: 'select',
        options: [
          { label: 'Real (BRL)', value: 'BRL' },
          { label: 'Dólar (USD)', value: 'USD' },
          { label: 'Euro (EUR)', value: 'EUR' },
        ],
      },
    ],
  },
  {
    id: 'customer',
    name: 'Cliente',
    icon: Users,
    filters: [
      {
        id: 'customer_segment',
        label: 'Segmento',
        value: '',
        type: 'multiselect',
        options: [
          { label: 'Enterprise', value: 'enterprise' },
          { label: 'SMB', value: 'smb' },
          { label: 'Startup', value: 'startup' },
          { label: 'Governo', value: 'government' },
        ],
      },
      {
        id: 'customer_age',
        label: 'Tempo como Cliente (meses)',
        value: '',
        type: 'range',
        min: 0,
        max: 120,
      },
      {
        id: 'satisfaction_score',
        label: 'Score de Satisfação',
        value: '',
        type: 'range',
        min: 1,
        max: 5,
      },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: TrendingUp,
    filters: [
      {
        id: 'conversion_rate',
        label: 'Taxa de Conversão (%)',
        value: '',
        type: 'range',
        min: 0,
        max: 100,
      },
      {
        id: 'growth_rate',
        label: 'Taxa de Crescimento (%)',
        value: '',
        type: 'range',
        min: -50,
        max: 200,
      },
      {
        id: 'region',
        label: 'Região',
        value: '',
        type: 'multiselect',
        options: [
          { label: 'Norte', value: 'north' },
          { label: 'Nordeste', value: 'northeast' },
          { label: 'Centro-Oeste', value: 'midwest' },
          { label: 'Sudeste', value: 'southeast' },
          { label: 'Sul', value: 'south' },
        ],
      },
    ],
  },
];

const COMPARISON_PERIODS: ComparisonPeriod[] = [
  {
    id: 'previous_period',
    label: 'Período Anterior',
    value: 'previous',
    description: 'Comparar com o período imediatamente anterior',
  },
  {
    id: 'same_period_last_year',
    label: 'Mesmo Período Ano Passado',
    value: 'year_over_year',
    description: 'Comparar com o mesmo período do ano anterior',
  },
  {
    id: 'rolling_average',
    label: 'Média Móvel',
    value: 'rolling',
    description: 'Comparar com a média móvel dos últimos períodos',
  },
  {
    id: 'baseline',
    label: 'Linha de Base',
    value: 'baseline',
    description: 'Comparar com um período de referência definido',
  },
];

const OPERATORS = {
  text: [
    { label: 'Contém', value: 'contains' },
    { label: 'É igual a', value: 'equals' },
    { label: 'Começa com', value: 'starts_with' },
    { label: 'Termina com', value: 'ends_with' },
  ],
  number: [
    { label: 'Igual a', value: 'equals' },
    { label: 'Maior que', value: 'greater_than' },
    { label: 'Menor que', value: 'less_than' },
    { label: 'Entre', value: 'between' },
  ],
  select: [
    { label: 'É', value: 'is' },
    { label: 'Não é', value: 'is_not' },
  ],
  multiselect: [
    { label: 'Inclui', value: 'includes' },
    { label: 'Exclui', value: 'excludes' },
    { label: 'Inclui qualquer', value: 'includes_any' },
  ],
};

// 🎨 Componente de filtro individual
const FilterControl: React.FC<{
  filter: FilterOption;
  onApply: (_field: string, _operator: string, _value: any) => void;
}> = ({ filter, onApply: _onApply }) => {
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState<any>('');
  const [rangeValue, setRangeValue] = useState<number[]>([0, 100]);

  const operators = OPERATORS[filter.type as keyof typeof OPERATORS] || [];

  const handleApply = () => {
    if (!operator) return;

    let finalValue = value;
    if (filter.type === 'range') {
      finalValue = rangeValue;
    }

    _onApply(filter.id, operator, finalValue);
  };

  const renderValueInput = () => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder="Digite o valor..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder="Digite o número..."
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={String(option.value)}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    if (isChecked) {
                      setValue([...(Array.isArray(value) ? value : []), option.value]);
                    } else {
                      setValue(
                        Array.isArray(value)
                          ? value.filter((v) => v !== option.value)
                          : []
                      );
                    }
                  }}
                />
                <Label htmlFor={String(option.value)}>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={rangeValue[0]}
                  onChange={(e) => setRangeValue([parseInt(e.target.value, 10) || 0, rangeValue[1]])}
                   min={filter.min || 0}
                   max={filter.max || 100}
                 />
                 <Input
                   type="number"
                   placeholder="Máx"
                   value={rangeValue[1]}
                   onChange={(e) => setRangeValue([rangeValue[0], parseInt(e.target.value, 10) || 100])}
                   min={filter.min || 0}
                   max={filter.max || 100}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Min: {rangeValue[0]}</span>
              <span>Max: {rangeValue[1]}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Operador</Label>
        <Select value={operator} onValueChange={(op: string) => setOperator(op)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o operador..." />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Valor</Label>
        {renderValueInput()}
      </div>

      <Button onClick={handleApply} className="w-full" disabled={!operator}>
        Aplicar Filtro
      </Button>
    </div>
  );
};

// 🏷️ Componente de filtro ativo
const ActiveFilterBadge: React.FC<{
  filter: ActiveFilter;
  onRemove: (_id: string) => void;
}> = ({ filter, onRemove: _onRemove }) => {
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === 'number') {
        return `${value[0]} - ${value[1]}`;
      }
      return value.join(', ');
    }
    return String(value);
  };

  return (
    <Badge variant="secondary" className="flex items-center gap-2">
      <span className="text-xs">
        {filter.label}: {formatValue(filter.value)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={() => _onRemove(filter.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
};

// 💾 Painel de filtros salvos
const SavedFiltersPanel: React.FC<{
  savedFilters: SavedFilter[];
  onLoad: (_filters: ActiveFilter[]) => void;
  onSave: (_name: string, _description: string, _isPublic: boolean) => void;
  onDelete: (_id: string) => void;
}> = ({ savedFilters: _savedFilters, onLoad: _onLoad, onSave: _onSave, onDelete: _onDelete }) => {

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Filtros Salvos</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
          >
            <Plus className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {_savedFilters.map((saved) => (
          <div
            key={saved.id}
            className="flex items-center justify-between p-2 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{saved.name}</span>
                {saved.isPublic && (
                  <Badge variant="outline" className="text-xs">
                    Público
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {saved.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {saved.filters.length} filtros
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => _onLoad(saved.filters)}
              >
                Carregar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => _onDelete(saved.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {_savedFilters.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Nenhum filtro salvo
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 📊 Componente principal de filtros avançados
export const AdvancedFilters: React.FC<{
  onFiltersChange: (_filters: ActiveFilter[]) => void;
  onComparisonChange: (_comparison: ComparisonPeriod | null) => void;
}> = ({ onFiltersChange, onComparisonChange }) => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<ComparisonPeriod | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar filtros salvos
  useEffect(() => {
    const mockSavedFilters: SavedFilter[] = [
      {
        id: '1',
        name: 'Clientes Enterprise Q1',
        description: 'Filtro para análise de clientes enterprise no Q1',
        filters: [],
        createdAt: new Date(),
        isPublic: true,
      },
      {
        id: '2',
        name: 'Performance Regional',
        description: 'Análise de performance por região',
        filters: [],
        createdAt: new Date(),
        isPublic: false,
      },
    ];
    setSavedFilters(mockSavedFilters);
  }, []);

  // Notificar mudanças nos filtros
  useEffect(() => {
    onFiltersChange(activeFilters);
  }, [activeFilters, onFiltersChange]);

  // Notificar mudanças na comparação
  useEffect(() => {
    onComparisonChange(selectedComparison);
  }, [selectedComparison, onComparisonChange]);

  const handleApplyFilter = (field: string, operator: string, value: any) => {
    const filterGroup = FILTER_GROUPS.find(group =>
      group.filters.some(f => f.id === field)
    );
    const filterOption = filterGroup?.filters.find(f => f.id === field);

    if (!filterOption) return;

    const newFilter: ActiveFilter = {
      id: `${field}_${Date.now()}`,
      field,
      operator,
      value,
      label: filterOption.label,
    };

    setActiveFilters(prev => [...prev, newFilter]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setSelectedComparison(null);
  };

  const handleLoadSavedFilter = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  };

  const handleSaveFilter = (name: string, description: string, isPublic: boolean) => {
    const newSavedFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      description,
      filters: activeFilters,
      createdAt: new Date(),
      isPublic,
    };

    setSavedFilters(prev => [...prev, newSavedFilter]);
  };

  const handleDeleteSavedFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  };

  const filteredGroups = FILTER_GROUPS.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.filters.some(filter =>
      filter.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Filtros Avançados</h3>
          <p className="text-sm text-muted-foreground">
            Configure filtros personalizados e comparações temporais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClearAllFilters}
            disabled={activeFilters.length === 0 && !selectedComparison}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Filtros ativos */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Filtros Ativos</Label>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <ActiveFilterBadge
                key={filter.id}
                filter={filter}
                onRemove={handleRemoveFilter}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de filtros */}
        <div className="lg:col-span-2 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar filtros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grupos de filtros */}
          <div className="space-y-4">
            {filteredGroups.map(group => {
              const Icon = group.icon;
              return (
                <Card key={group.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5" />
                      {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.filters.map(filter => (
                        <Popover key={filter.id}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start">
                              <Filter className="h-4 w-4 mr-2" />
                              {filter.label}
                              <ChevronDown className="h-4 w-4 ml-auto" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">{filter.label}</h4>
                              <FilterControl
                                filter={filter}
                                onApply={handleApplyFilter}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparações temporais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparações Temporais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label>Selecione um tipo de comparação</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMPARISON_PERIODS.map(period => (
                    <div
                      key={period.id}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-colors',
                        selectedComparison?.id === period.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedComparison(
                        selectedComparison?.id === period.id ? null : period
                      )}
                    >
                      <div className="font-medium text-sm">{period.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {period.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          <SavedFiltersPanel
            savedFilters={savedFilters}
            onLoad={handleLoadSavedFilter}
            onSave={handleSaveFilter}
            onDelete={handleDeleteSavedFilter}
          />

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Filtros ativos:</span>
                <span className="font-medium">{activeFilters.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Comparação:</span>
                <span className="font-medium">
                  {selectedComparison ? selectedComparison.label : 'Nenhuma'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Filtros salvos:</span>
                <span className="font-medium">{savedFilters.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;