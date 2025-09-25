'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ServiceOrderForm } from "@/components/service-order-form"
import { 
  ResponsiveContainer, 
  ResponsiveText, 
  useBreakpoint 
} from '@/components/ui/responsive-utils'

export default function ServiceOrderPage() {
  const { isMobile } = useBreakpoint()

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <ResponsiveText 
                    size={isMobile ? "2xl" : "3xl"}
                    className="font-bold tracking-tight"
                  >
                    Ordem de Serviço
                  </ResponsiveText>
                  <ResponsiveText 
                    size={isMobile ? "sm" : "base"}
                    className="text-muted-foreground"
                  >
                    Autorizada Apple - Criação de ordem de serviço para dispositivos Apple
                  </ResponsiveText>
                </div>
                <ServiceOrderForm />
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}