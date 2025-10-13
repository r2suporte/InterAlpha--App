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

export default function ServiceOrderPage() {
  const { isMobile } = useBreakpoint();

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6 flex items-center gap-4">
                  <BackButton href="/dashboard" />
                  <div>
                    <ResponsiveText
                      size={isMobile ? '2xl' : '3xl'}
                      className="font-bold tracking-tight"
                    >
                      Ordem de Serviço
                    </ResponsiveText>
                  </div>
                </div>
                <div className="mb-6">
                  <ResponsiveText
                    size={isMobile ? 'sm' : 'base'}
                    className="text-muted-foreground"
                  >
                    Autorizada Apple - Criação de ordem de serviço para
                    dispositivos Apple
                  </ResponsiveText>
                </div>
                <ServiceOrderForm />
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
