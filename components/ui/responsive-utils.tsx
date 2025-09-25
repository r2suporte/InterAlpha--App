'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Hook para detectar tamanho da tela
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('sm');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 768) {
        setBreakpoint('md');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 1024) {
        setBreakpoint('lg');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else if (width < 1280) {
        setBreakpoint('xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      } else {
        setBreakpoint('2xl');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return { breakpoint, isMobile, isTablet, isDesktop };
}

// Componente de container responsivo
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-none',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridCols = `grid-cols-${cols.sm || 1} md:grid-cols-${cols.md || 2} lg:grid-cols-${cols.lg || 3} xl:grid-cols-${cols.xl || 4}`;

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Navegação mobile
interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MobileNav({ isOpen, onToggle, children, className }: MobileNavProps) {
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={onToggle}
          />
          <div className={cn(
            'absolute top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform',
            'animate-in slide-in-from-right-full',
            className
          )}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={onToggle}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Tabela responsiva
interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-full inline-block align-middle">
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

// Card responsivo
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function ResponsiveCard({ 
  children, 
  className,
  padding = 'md',
  hover = false
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg shadow-sm',
      paddingClasses[padding],
      hover && 'hover:shadow-md transition-shadow',
      className
    )}>
      {children}
    </div>
  );
}

// Seção colapsável para mobile
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false,
  className 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isMobile } = useBreakpoint();

  // No mobile, sempre colapsável. No desktop, sempre aberto
  const shouldCollapse = isMobile;
  const isCollapsed = shouldCollapse && !isOpen;

  return (
    <div className={cn('border border-gray-200 rounded-lg', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          shouldCollapse ? 'hover:bg-gray-50' : 'cursor-default'
        )}
        disabled={!shouldCollapse}
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {shouldCollapse && (
          isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />
        )}
      </button>
      
      {!isCollapsed && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Stack responsivo (vertical no mobile, horizontal no desktop)
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function ResponsiveStack({ 
  children, 
  className,
  direction = 'responsive',
  spacing = 'md',
  align = 'stretch'
}: ResponsiveStackProps) {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
    responsive: 'flex-col sm:flex-row'
  };

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      spacingClasses[spacing],
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
}

// Texto responsivo
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export function ResponsiveText({ children, size = 'base', className }: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl'
  };

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

// Utilitário para mostrar/esconder em diferentes breakpoints
interface ShowHideProps {
  children: React.ReactNode;
  on?: ('sm' | 'md' | 'lg' | 'xl')[];
  hide?: ('sm' | 'md' | 'lg' | 'xl')[];
}

export function ShowHide({ children, on, hide }: ShowHideProps) {
  let classes = '';

  if (on) {
    classes += 'hidden ';
    on.forEach(breakpoint => {
      classes += `${breakpoint}:block `;
    });
  }

  if (hide) {
    classes += 'block ';
    hide.forEach(breakpoint => {
      classes += `${breakpoint}:hidden `;
    });
  }

  return <div className={classes.trim()}>{children}</div>;
}