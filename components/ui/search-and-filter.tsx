'use client';

import React, { useState } from 'react';

import { Filter, Search, X } from 'lucide-react';

import { Button } from './button';
import { Card, CardContent } from './card';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  filterOptions: FilterConfig[];
  className?: string;
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Pesquisar...',
  filters,
  onFiltersChange,
  filterOptions,
  className = '',
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || !value) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const activeFiltersCount =
    Object.keys(filters).length + (searchValue ? 1 : 0);

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center gap-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 px-2 text-muted-foreground"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Limpar
                        </Button>
                      )}
                    </div>

                    {filterOptions.map(filterConfig => (
                      <div key={filterConfig.key} className="space-y-2">
                        <label className="text-sm font-medium">
                          {filterConfig.label}
                        </label>
                        <Select
                          value={filters[filterConfig.key] || 'all'}
                          onValueChange={value =>
                            handleFilterChange(filterConfig.key, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {filterConfig.options.map(option => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchValue && (
                <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground">
                  <span>Busca: "{searchValue}"</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {Object.entries(filters).map(([key, value]) => {
                const filterConfig = filterOptions.find(f => f.key === key);
                const option = filterConfig?.options.find(
                  o => o.value === value
                );

                if (!filterConfig || !option) return null;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
                  >
                    <span>
                      {filterConfig.label}: {option.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange(key, 'all')}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
