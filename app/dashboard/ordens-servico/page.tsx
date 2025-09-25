'use client'

import { ServiceOrderForm } from '@/components/service-order-form'
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { 
  ResponsiveContainer, 
  ResponsiveText, 
  useBreakpoint 
} from '@/components/ui/responsive-utils'

export default function OrdensServicoPage() {
  const { isMobile } = useBreakpoint()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          <div className="space-y-2">
            <ResponsiveText 
              size={isMobile ? "2xl" : "3xl"}
              className="font-bold tracking-tight"
            >
              Ordens de Serviço
            </ResponsiveText>
            <ResponsiveText 
              size={isMobile ? "sm" : "base"}
              className="text-muted-foreground"
            >
              Autorizada Apple - Criação de ordem de serviço para dispositivos Apple
            </ResponsiveText>
          </div>
          
          <ServiceOrderForm />
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}