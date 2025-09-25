import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { ResponsiveContainer } from '@/components/ui/responsive-utils'
import AlertsDashboard from '@/components/alerts/alerts-dashboard';

export default function AlertsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 pt-6">
          <AlertsDashboard />
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}