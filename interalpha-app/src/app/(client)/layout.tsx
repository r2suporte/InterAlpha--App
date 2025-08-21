import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal do Cliente - InterAlpha',
  description: 'Acesse suas informações e acompanhe seus serviços',
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}