'use client';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { ServiceOrderForm } from '@/components/service-order-form';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import {
  ResponsiveContainer,
  ResponsiveText,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function OrdensServicoPage() {
  const { isMobile } = useBreakpoint();

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          <div className="mb-6 flex items-center gap-4">
            <BackButton href="/dashboard" />
            <div>
              <ResponsiveText
                size={isMobile ? '2xl' : '3xl'}
                className="font-bold tracking-tight"
              >
                Ordens de Serviço
              </ResponsiveText>
            </div>
          </div>
          <div className="space-y-2">
            <ResponsiveText
              size={isMobile ? 'sm' : 'base'}
              className="text-muted-foreground"
            >
              Autorizada Apple - Criação de ordem de serviço para dispositivos
              Apple
            </ResponsiveText>
          </div>

          <ServiceOrderForm />
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
