'use client';

import React from 'react';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

import {
  Building2,
  ChevronRight,
  Search,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { navigationGroups as navigationGroupsFromConfig } from '@/components/navigation/navigation-config';

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

const navigationGroups: NavGroup[] = navigationGroupsFromConfig;

// Cores por grupo de navegação para visual pastel
const groupColors: Record<string, { dot: string; label: string }> = {
  'Visão Geral': { dot: 'bg-violet-400', label: 'text-violet-600 dark:text-violet-400' },
  'Operações': { dot: 'bg-sky-400', label: 'text-sky-600 dark:text-sky-400' },
  'Financeiro': { dot: 'bg-emerald-400', label: 'text-emerald-600 dark:text-emerald-400' },
  'Análises': { dot: 'bg-amber-400', label: 'text-amber-600 dark:text-amber-400' },
  'Administração': { dot: 'bg-rose-400', label: 'text-rose-600 dark:text-rose-400' },
};

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
        'group/nav flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
        'text-sidebar-foreground/70 hover:text-sidebar-foreground',
        'hover:bg-primary/8 dark:hover:bg-primary/12',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive && [
          'bg-primary/12 text-primary font-semibold',
          'dark:bg-primary/20 dark:text-primary',
          'shadow-sm',
        ],
        isCollapsed && 'justify-center px-2'
      )}
    >
      <item.icon
        className={cn(
          'h-4 w-4 shrink-0 transition-all duration-200',
          isActive
            ? 'text-primary'
            : 'text-sidebar-foreground/50 group-hover/nav:text-sidebar-foreground/80'
        )}
      />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.title}</span>
          {item.badge && (
            <Badge
              variant="secondary"
              className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-xs bg-primary/15 text-primary border-0"
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

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
  const colors = groupColors[group.label] ?? { dot: 'bg-primary', label: 'text-muted-foreground' };

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
        <CollapsibleTrigger className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
          'hover:bg-primary/6',
          colors.label
        )}>
          <div className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
            <span>{group.label}</span>
          </div>
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-90')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-0.5 pt-1">
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
      <div className={cn('flex items-center gap-2 px-3 py-1.5', colors.label)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
        <h3 className="text-xs font-semibold uppercase tracking-wider">{group.label}</h3>
      </div>
      <div className="space-y-0.5">
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

interface EnhancedSidebarProps {
  className?: string;
  isCollapsed?: boolean;
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  className,
  isCollapsed = false,
}) => {
  const pathname = usePathname();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = React.useState('');

  const userName = user?.fullName ?? user?.firstName ?? 'Usuário';
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? '';
  const userInitials = userName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase() ?? '')
    .join('');

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
        'flex h-full flex-col border-r',
        'bg-gradient-to-b from-sidebar to-sidebar/95',
        'border-sidebar-border',
        isCollapsed ? 'w-16' : 'w-64',
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      {/* ══ Logo Header ══ */}
      <div className="flex h-16 items-center border-b border-sidebar-border/60 px-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-md shadow-primary/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                InterAlpha
              </span>
              <span className="text-xs text-sidebar-foreground/50">Painel de Gestão</span>
            </div>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-md shadow-primary/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* ══ Search ══ */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm bg-background/50 border-sidebar-border/60 focus:bg-background"
            />
          </div>
        </div>
      )}

      {/* ══ Navigation ══ */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1 py-2">
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

      {/* ══ User Footer ══ */}
      <div className="border-t border-sidebar-border/60 p-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-primary/6 transition-colors cursor-pointer">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white text-xs font-semibold">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
              <p className="truncate text-xs text-sidebar-foreground/50">{userEmail}</p>
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center cursor-pointer">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={userName}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white text-xs font-semibold">
                      {userInitials}
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="space-y-1">
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
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
