import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { Inter } from 'next/font/google';

import { ToastProvider } from '@/components/ui/toast-system';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InterAlpha App',
  description: 'InterAlpha Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body className={inter.className}>
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
