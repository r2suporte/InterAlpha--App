'use client';

import { useRouter } from 'next/navigation';

import {
  ChevronDown,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
} from 'lucide-react';

import { NotificationCenter } from '@/components/notifications/notification-center';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchBar } from './site-header/search-bar';
import { QuickCreateButton } from './site-header/quick-create-button';
import { UserMenu } from './site-header/user-menu';

export function SiteHeader() {
  const router = useRouter();

  const handleNewOS = () => {
    router.push('/dashboard/ordem-servico');
  };
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/40 bg-gradient-to-r from-white/90 via-slate-50/95 to-white/90 shadow-sm backdrop-blur-md transition-[width,height] ease-linear dark:border-slate-700/40 dark:from-slate-950/90 dark:via-slate-900/95 dark:to-slate-950/90">
      <div className="flex w-full items-center justify-between gap-4 px-4 lg:px-6">
          {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1 rounded-lg transition-all duration-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/70" />
          <Separator
            orientation="vertical"
            className="mx-2 bg-slate-200/60 data-[orientation=vertical]:h-6 dark:bg-slate-700/60"
          />

          {/* Search Bar */}
          <SearchBar />
        </div>

          {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <QuickCreateButton />

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
