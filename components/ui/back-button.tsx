'use client';

import React, { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BackButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({ href, className, children }: BackButtonProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      if (href) {
        // Navegação para URL específica
        await router.push(href);
      } else {
        // Verificar se há histórico para voltar
        if (window.history.length > 1) {
          router.back();
        } else {
          // Se não há histórico, ir para dashboard
          await router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Erro na navegação:', error);

      // Fallback usando window.location
      try {
        const targetUrl = href || '/dashboard';
        window.location.href = targetUrl;
      } catch (fallbackError) {
        console.error('Erro no fallback de navegação:', fallbackError);
      }
    } finally {
      // Reset do estado após um pequeno delay
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [router, href, isNavigating]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleNavigation();
    },
    [handleNavigation]
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isNavigating}
      className={`flex items-center gap-2 transition-all duration-200 hover:bg-accent ${className || ''}`}
      aria-label={href ? `Navegar para ${href}` : 'Voltar'}
    >
      <ArrowLeft
        className={`h-4 w-4 transition-transform duration-200 ${isNavigating ? 'animate-pulse' : ''}`}
      />
      {children || 'Voltar'}
    </Button>
  );
}
