import type { Metadata } from 'next'
// Removendo a importação da fonte Inter que está causando erros
// import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import AppProviders from '@/contexts/AppProviders'

// Usando uma classe CSS padrão em vez da fonte Inter
const interClassName = 'font-sans'

export const metadata: Metadata = {
  title: 'InterAlpha - Sistema de Gestão',
  description: 'Sistema completo de gestão empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className={interClassName}>
          <AppProviders>
            {children}
          </AppProviders>
        </body>
      </html>
    </ClerkProvider>
  )
}