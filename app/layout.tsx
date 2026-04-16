import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { Analytics } from '@vercel/analytics/react';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers/query-provider';
import { ToastProvider } from '@/components/ui/toast-system';
import { envPublic } from '@/lib/config/env.public';

import './globals.css';

export const metadata: Metadata = {
  title: 'InterAlpha — Gestão de Serviços',
  description: 'Plataforma completa para gestão de ordens de serviço, clientes e equipe técnica.',
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
        <body className="font-sans antialiased">
          <Providers>
            <ToastProvider>{children}</ToastProvider>
          </Providers>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
