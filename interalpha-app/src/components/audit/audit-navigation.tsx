'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  BarChart3, 
  FileText, 
  Shield, 
  Settings, 
  Activity,
  Search
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/auditoria',
    icon: BarChart3,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Logs de Auditoria',
    href: '/auditoria/logs',
    icon: Activity,
    description: 'Logs de atividades'
  },
  {
    name: 'Eventos de Segurança',
    href: '/auditoria/seguranca',
    icon: Shield,
    description: 'Monitoramento de segurança'
  },
  {
    name: 'Relatórios',
    href: '/auditoria/relatorios',
    icon: FileText,
    description: 'Relatórios e compliance'
  },
  {
    name: 'Configurações',
    href: '/auditoria/configuracoes',
    icon: Settings,
    description: 'Configurações do sistema'
  }
]

export function AuditNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-1 border-b">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/auditoria' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors',
              isActive
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}