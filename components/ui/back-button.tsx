'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function BackButton({ href, className, children, onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔵 BackButton clicked - NATIVE BUTTON');

    if (onClick) {
      console.log('🔵 Executing onClick prop');
      onClick();
    } else if (href) {
      console.log(`🔵 Navigating to href: ${href}`);
      router.push(href);
    } else {
      console.log('🔵 Executing router.back()');
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className || ''}`}
      type="button"
      aria-label="Voltar"
      style={{ pointerEvents: 'auto', zIndex: 9999, position: 'relative' }}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Voltar'}
    </button>
  );
}
