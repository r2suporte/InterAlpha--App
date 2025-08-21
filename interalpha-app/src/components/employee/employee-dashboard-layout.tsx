'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Settings, 
  Bell, 
  LogOut, 
  Menu,
  X,
  Shield,
  User,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeData {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  department?: string
  avatar?: string
}

interface NavigationItem {
  label: string
  href: string
  icon: ReactNode
  permissions?: string[]
  badge?: string
}

interface EmployeeDashboardLayoutProps {
  children: ReactNode
  navigation?: NavigationItem[]
  title?: string
  subtitle?: string
}

export function EmployeeDashboardLayout({ 
  children, 
  navigation = [], 
  title = "Portal dos Funcionários", 
  subtitle 
}: EmployeeDashboardLayoutProps) {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const router = useRouter()

  useEffect(() => {
    loadEmployeeData()
    loadNotifications()
  }, [])

  const loadEmployeeData = () => {
    const data = localStorage.getItem('employee_data')
    if (data) {
      setEmployeeData(JSON.parse(data))
    } else {
      router.push('/employee/login')
    }
  }

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('employee_token')
      if (!token) return

      const response = await fetch('/api/employee/notifications/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.count)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_data')
    toast.success('Logout realizado com sucesso')
    router.push('/employee/login')
  }

  const getRoleName = (role: string) => {
    const roleNames = {
      'ATENDENTE': 'Atendente',
      'TECNICO': 'Técnico',
      'SUPERVISOR_TECNICO': 'Supervisor Técnico',
      'GERENTE_ADM': 'Gerente Administrativo',
      'GERENTE_FINANCEIRO': 'Gerente Financeiro'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors = {
      'ATENDENTE': 'bg-blue-100 text-blue-800',
      'TECNICO': 'bg-green-100 text-green-800',
      'SUPERVISOR_TECNICO': 'bg-purple-100 text-purple-800',
      'GERENTE_ADM': 'bg-red-100 text-red-800',
      'GERENTE_FINANCEIRO': 'bg-yellow-100 text-yellow-800'
    }
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'
  }

  const hasPermission = (requiredPermissions?: string[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    if (!employeeData?.permissions) return false
    
    return requiredPermissions.some(permission => 
      employeeData.permissions.includes(permission)
    )
  }

  const filteredNavigation = navigation.filter(item => hasPermission(item.permissions))

  if (!employeeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">InterAlpha</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {employeeData.name}
              </p>
              <Badge className={`text-xs ${getRoleColor(employeeData.role)}`}>
                {getRoleName(employeeData.role)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-3"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {notifications > 9 ? '9+' : notifications}
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}