import AlertsDashboard from '@/components/alerts/alerts-dashboard';
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { ResponsiveContainer } from '@/components/ui/responsive-utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function AlertsPage() {
  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 pt-6">
          <AlertsDashboard />
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
