'use client'

import { Bell, Search, User, Moon, Sun, Sparkles, LogOut, Settings, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEmployee } from '@/hooks/use-employee'
import { useTheme } from '@/contexts/ThemeContext'
import { useClerk } from '@clerk/nextjs'

export default function Header() {
  const { employee, displayName, email, roleLabel, initials, avatarUrl, isAdmin } = useEmployee()
  const { theme, toggleTheme } = useTheme()
  const { signOut } = useClerk()

  const handleSignOut = () => {
    signOut()
  }
  
  return (
    <header className={`sticky top-0 z-40 px-6 py-4 ${
      theme === 'dark' 
        ? 'bg-gray-900/80 border-gray-700' 
        : 'bg-white/80 border-gray-200/50'
    } border-b backdrop-blur-xl`}>
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">IA</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              InterAlpha
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Sistema de Gestão
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar clientes, ordens de serviço, pagamentos..."
              className={`w-full pl-12 pr-4 py-3 ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500'
              } border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm`}
            />
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl hover:bg-gray-100/50 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-600" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-xl hover:bg-gray-100/50 transition-colors relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </Button>
          
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200/50">
            <div className="text-right hidden sm:block">
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {displayName}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{email}</span>
                {roleLabel && (
                  <Badge variant="outline" className="text-xs">
                    {roleLabel}
                  </Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-blue-600">
                        {initials || <User className="h-5 w-5" />}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                    {roleLabel && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        {roleLabel}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Administração</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}