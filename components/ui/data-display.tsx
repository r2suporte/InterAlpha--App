'use client';

import * as React from 'react';

import {
  BarChart3,
  Calendar,
  Clock,
  Database,
  DollarSign,
  FileText,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Server,
  TrendingUp,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mapeamento de ícones disponíveis
const iconMap = {
  calendar: Calendar,
  clock: Clock,
  user: User,
  mail: Mail,
  phone: Phone,
  mapPin: MapPin,
  hash: Hash,
  dollarSign: DollarSign,
  package: Package,
  fileText: FileText,
  server: Server,
  database: Database,
  refreshCw: RefreshCw,
  barChart3: BarChart3,
  trendingUp: TrendingUp,
} as const;

type IconName = keyof typeof iconMap;

interface DataFieldProps {
  label: string;
  value: string | number | React.ReactNode;
  icon?: IconName;
  className?: string;
  copyable?: boolean;
}

export function DataField({
  label,
  value,
  icon,
  className,
  copyable = false,
}: DataFieldProps) {
  const handleCopy = async () => {
    if (copyable && typeof value === 'string') {
      try {
        await navigator.clipboard.writeText(value);
        // Aqui você pode adicionar um toast de sucesso
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    }
  };

  const Icon = icon ? iconMap[icon] : null;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <div
        className={cn(
          'text-sm text-foreground',
          copyable && 'cursor-pointer transition-colors hover:text-primary'
        )}
        onClick={copyable ? handleCopy : undefined}
        title={copyable ? 'Clique para copiar' : undefined}
      >
        {value || '—'}
      </div>
    </div>
  );
}

interface DataGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DataGrid({ children, columns = 2, className }: DataGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  );
}

interface DataSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function DataSection({
  title,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: DataSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'flex items-center justify-between',
          collapsible && 'cursor-pointer'
        )}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {collapsible && (
          <span className="text-muted-foreground">{isOpen ? '−' : '+'}</span>
        )}
      </div>
      {(!collapsible || isOpen) && (
        <>
          <Separator />
          {children}
        </>
      )}
    </div>
  );
}

interface DataCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function DataCard({
  title,
  children,
  className,
  actions,
}: DataCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// Componentes específicos para diferentes tipos de dados
export function ContactInfo({
  email,
  phone,
  address,
}: {
  email?: string;
  phone?: string;
  address?: string;
}) {
  return (
    <DataGrid columns={1}>
      {email && <DataField label="E-mail" value={email} icon="mail" copyable />}
      {phone && (
        <DataField label="Telefone" value={phone} icon="phone" copyable />
      )}
      {address && <DataField label="Endereço" value={address} icon="mapPin" />}
    </DataGrid>
  );
}

export function DateTimeInfo({
  createdAt,
  updatedAt,
  dueDate,
}: {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  dueDate?: string | Date;
}) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DataGrid columns={3}>
      {createdAt && (
        <DataField
          label="Criado em"
          value={formatDate(createdAt)}
          icon="calendar"
        />
      )}
      {updatedAt && (
        <DataField
          label="Atualizado em"
          value={formatDate(updatedAt)}
          icon="clock"
        />
      )}
      {dueDate && (
        <DataField label="Prazo" value={formatDate(dueDate)} icon="calendar" />
      )}
    </DataGrid>
  );
}

export function FinancialInfo({
  cost,
  price,
  profit,
  currency = 'R$',
}: {
  cost?: number;
  price?: number;
  profit?: number;
  currency?: string;
}) {
  const formatCurrency = (value: number) => {
    return `${currency} ${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <DataGrid columns={3}>
      {cost !== undefined && (
        <DataField
          label="Custo"
          value={formatCurrency(cost)}
          icon="dollarSign"
        />
      )}
      {price !== undefined && (
        <DataField
          label="Preço"
          value={formatCurrency(price)}
          icon="dollarSign"
        />
      )}
      {profit !== undefined && (
        <DataField
          label="Lucro"
          value={formatCurrency(profit)}
          icon="dollarSign"
        />
      )}
    </DataGrid>
  );
}
