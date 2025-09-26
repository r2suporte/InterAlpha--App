"use client"

import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Settings, 
  User, 
  Moon, 
  Sun,
  ChevronDown,
  Plus
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationCenter } from "@/components/notifications/notification-center"

export function SiteHeader() {
  const router = useRouter()

  const handleNewOS = () => {
    router.push('/dashboard/ordem-servico')
  }
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/40 dark:border-slate-700/40 bg-gradient-to-r from-white/90 via-slate-50/95 to-white/90 dark:from-slate-950/90 dark:via-slate-900/95 dark:to-slate-950/90 backdrop-blur-md shadow-sm transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all duration-200 rounded-lg" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-6 bg-slate-200/60 dark:bg-slate-700/60"
          />
          
          {/* Search Bar */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
            <Input
              placeholder="Buscar ordens, clientes..."
              className="pl-10 w-80 bg-slate-50/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-700/60 focus:border-blue-500 dark:focus:border-blue-400 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <Button size="sm" className="hidden lg:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm" onClick={handleNewOS}>
            <Plus className="mr-2 h-4 w-4" />
            Nova OS
          </Button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  A
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
