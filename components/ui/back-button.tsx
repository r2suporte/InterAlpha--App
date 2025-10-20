'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BackButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
  onBack?: () => void;
}

export function BackButton({ href, className, children, onBack }: BackButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevenir múltiplos cliques
    if (isLoading) {
      return;
    }
    
    try {
      setIsLoading(true);

      // Chamar callback customizado se fornecido
      if (onBack) {
        await onBack();
      }

      // Dar um pequeno delay para UX feedback
      await new Promise(resolve => setTimeout(resolve, 100));

      if (href) {
        // Navegação para URL específica
        router.push(href);
      } else {
        // Tentar voltar no histórico
        // Em Next.js, window.history.length pode não ser confiável
        // Então priorizamos router.back() e caimos para dashboard se necessário
        try {
          router.back();
        } catch (error) {
          // Se router.back() falhar, ir para dashboard
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Erro ao navegar:', error);
      // Fallback para dashboard em caso de erro
      router.push('/dashboard');
    } finally {
      // Pequeno delay antes de permitir novos cliques (300ms é suficiente)
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-2 transition-all duration-200 hover:bg-accent disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
      aria-label={href ? `Navegar para ${href}` : 'Voltar'}
      type="button"
    >
      <ArrowLeft className={`h-4 w-4 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
      {children || 'Voltar'}
    </Button>
  );
}
