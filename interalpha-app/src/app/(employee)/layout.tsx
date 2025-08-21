'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MessageSquare, 
  Settings, 
  FileText,
  Home
} from 'lucide-react'
import { EmployeeDashboardLayout } from '@/components/employee/employee-dashboard-layout'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'Comunicação',
    href: '/comunicacao',
    icon: MessageSquare
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: FileText
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings
  }
]

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <EmployeeDashboardLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">Portal dos Funcionários</h2>
          </div>
          
          <nav className="px-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </EmployeeDashboardLayout>
  )
}