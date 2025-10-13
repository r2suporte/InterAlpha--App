'use client';

import React, { useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icons
import {
  BarChart3,
  Bell,
  Building2,
  Calculator,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
// UI Components
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { navigationGroups as navigationGroupsFromConfig } from '@/components/navigation/navigation-config';

// Tipos para os itens de navegação
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

// Configuração dos grupos de navegação centralizada em navigation-config.ts
const navigationGroups: NavGroup[] = navigationGroupsFromConfig;

// Componente para item de navegação individual
interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed?: boolean;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({
  item,
  isActive,
  isCollapsed = false,
}) => {
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent text-accent-foreground shadow-sm',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <item.icon
        className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')}
      />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed && item.description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

// Componente para grupo de navegação
interface NavGroupComponentProps {
  group: NavGroup;
  pathname: string;
  isCollapsed?: boolean;
}

const NavGroupComponent: React.FC<NavGroupComponentProps> = ({
  group,
  pathname,
  isCollapsed = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(group.defaultOpen ?? true);

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {group.items.map(item => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            isCollapsed={true}
          />
        ))}
      </div>
    );
  }

  if (group.collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <span>{group.label}</span>
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-90'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-1">
          {group.items.map(item => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {group.label}
      </h3>
      <div className="space-y-1">
        {group.items.map(item => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </div>
  );
};

// Componente principal do sidebar
interface EnhancedSidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  className,
  isCollapsed = false,
}) => {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filtrar itens baseado na busca
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return navigationGroups;

    return navigationGroups
      .map(group => ({
        ...group,
        items: group.items.filter(
          item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [searchQuery]);

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background',
        isCollapsed && 'w-16',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">InterAlfa</span>
              <span className="text-xs text-muted-foreground">Painel</span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Criar Novo
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4 pb-4">
          {filteredGroups.map(group => (
            <NavGroupComponent
              key={group.label}
              group={group}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <span className="text-xs font-medium">IA</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">InterAlfa Admin</p>
              <p className="truncate text-xs text-muted-foreground">
                admin@interalfa.com
              </p>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <span className="text-xs font-medium">IA</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="space-y-1">
                  <p className="font-medium">InterAlfa Admin</p>
                  <p className="text-xs text-muted-foreground">
                    admin@interalfa.com
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default EnhancedSidebar;
