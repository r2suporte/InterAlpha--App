'use client';

import React, { useRef } from 'react';

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
  const isNavigatingRef = useRef(false);

  const handleClick = (_e: React.MouseEvent) => {
    // NÃO usar preventDefault pois bloqueia a navegação do Next.js
    
    // Prevenir múltiplos cliques
    if (isNavigatingRef.current) {
      return;
    }
    
    isNavigatingRef.current = true;

    if (href) {
      // Navegação para URL específica
      router.push(href);
    } else {
      // Voltar no histórico ou ir para dashboard
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/dashboard');
      }
    }

    // Reset após delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-2 transition-all duration-200 hover:bg-accent ${className || ''}`}
      aria-label={href ? `Navegar para ${href}` : 'Voltar'}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Voltar'}
    </Button>
  );
}
