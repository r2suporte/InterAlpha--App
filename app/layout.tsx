import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import type { ReactNode } from 'react';

import { ToastProvider } from '@/components/ui/toast-system';
import { envPublic } from '@/lib/config/env.public';

import './globals.css';

export const metadata: Metadata = {
  title: 'InterAlpha App',
  description: 'InterAlpha Application',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const clerkPublishableKey = envPublic.clerk.publishableKey();

  return (
    <ClerkProvider localization={ptBR} publishableKey={clerkPublishableKey}>
      <html lang="pt-BR">
        <body>
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
