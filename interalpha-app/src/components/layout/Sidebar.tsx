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
  BarChart3,
  Shield,
  Package,
  Sparkles,
  UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100/50'
  },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: Users,
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100/50'
  },
  { 
    name: 'Ordens de Serviço', 
    href: '/ordens-servico', 
    icon: Wrench,
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100/50'
  },
  { 
    name: 'Produtos', 
    href: '/produtos', 
    icon: Package,
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100/50'
  },
  { 
    name: 'Pagamentos', 
    href: '/pagamentos', 
    icon: CreditCard,
    gradient: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100/50'
  },
  { 
    name: 'Relatórios', 
    href: '/relatorios', 
    icon: BarChart3,
    gradient: 'from-indigo-500 to-indigo-600',
    bgGradient: 'from-indigo-50 to-indigo-100/50'
  },
  { 
    name: 'Auditoria', 
    href: '/auditoria', 
    icon: Shield,
    gradient: 'from-red-500 to-red-600',
    bgGradient: 'from-red-50 to-red-100/50'
  },
  { 
    name: 'Funcionários', 
    href: '/admin/funcionarios', 
    icon: UserCog,
    gradient: 'from-pink-500 to-pink-600',
    bgGradient: 'from-pink-50 to-pink-100/50'
  },
  { 
    name: 'Configurações', 
    href: '/configuracoes', 
    icon: Settings,
    gradient: 'from-gray-500 to-gray-600',
    bgGradient: 'from-gray-50 to-gray-100/50'
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()

  return (
    <div className={`w-72 ${
      theme === 'dark' 
        ? 'bg-gray-900/50 border-gray-700' 
        : 'bg-white/50 border-gray-200/50'
    } border-r min-h-screen backdrop-blur-xl`}>
      <div className="p-6">
        {/* Navigation Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Navegação
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center space-x-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden',
                  isActive
                    ? `bg-gradient-to-r ${item.bgGradient} text-gray-900 shadow-lg border border-white/50`
                    : theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-50/50 hover:text-gray-900'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${item.gradient} rounded-r-full`}></div>
                )}
                
                {/* Icon with gradient background when active */}
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group-hover:scale-110',
                  isActive
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                    : 'bg-transparent group-hover:bg-gray-100/50'
                )}>
                  <item.icon className={cn(
                    'h-4 w-4 transition-all duration-200',
                    isActive 
                      ? 'text-white' 
                      : theme === 'dark'
                      ? 'text-gray-400 group-hover:text-gray-300'
                      : 'text-gray-500 group-hover:text-gray-700'
                  )} />
                </div>
                
                <span className="flex-1">{item.name}</span>
                
                {/* Active glow effect */}
                {isActive && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-12 pt-6 border-t border-gray-200/50">
          <div className={`p-4 rounded-xl ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-800/50 to-gray-700/50' 
              : 'bg-gradient-to-br from-blue-50/50 to-purple-50/50'
          } border border-white/20`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Upgrade Pro</p>
                <p className="text-xs text-gray-500">Recursos avançados</p>
              </div>
            </div>
            <button className="w-full text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
              Saiba Mais
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}