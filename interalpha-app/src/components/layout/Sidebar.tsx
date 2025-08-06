'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  CreditCard, 
  Settings,
  FileText,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Ordens de Serviço', href: '/ordens-servico', icon: Wrench },
  { name: 'Pagamentos', href: '/pagamentos', icon: CreditCard },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}