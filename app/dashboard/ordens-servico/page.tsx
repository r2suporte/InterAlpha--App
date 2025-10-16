'use client';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { ServiceOrderForm } from '@/components/service-order-form';
import { OrdemServicoList } from '@/components/ordem-servico-list';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import {
  ResponsiveContainer,
  ResponsiveText,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, List } from 'lucide-react';
import { useState } from 'react';

// 🎯 Determinar descrição da view
function getViewDescription(view: 'list' | 'create' | 'edit', _isMobile: boolean): string {
  if (view === 'list') return 'Gerencie todas as ordens de serviço da autorizada Apple';
  if (view === 'create') return 'Criação de nova ordem de serviço para dispositivos Apple';
  return 'Edição de ordem de serviço';
}

export default function OrdensServicoPage() {
  const { isMobile } = useBreakpoint();
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedOrdemId, setSelectedOrdemId] = useState<string | null>(null);

  const handleCreateNew = () => {
    setSelectedOrdemId(null);
    setView('create');
  };

  const handleEdit = (id: string) => {
    setSelectedOrdemId(id);
    setView('edit');
  };

  const handleView = (id: string) => {
    setSelectedOrdemId(id);
    setView('edit'); // Pode criar uma view específica depois
  };

  const handleBackToList = () => {
    setSelectedOrdemId(null);
    setView('list');
  };

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <ResponsiveContainer padding="md" className="flex-1 space-y-6 pt-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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

            {view !== 'list' && (
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Ver Lista
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <ResponsiveText
              size={isMobile ? 'sm' : 'base'}
              className="text-muted-foreground"
            >
              {getViewDescription(view, isMobile)}
            </ResponsiveText>
          </div>

          {view === 'list' ? (
            <OrdemServicoList
              onCreateNew={handleCreateNew}
              onEdit={handleEdit}
              onView={handleView}
            />
          ) : (
            <ServiceOrderForm
              ordemId={selectedOrdemId}
              onSuccess={handleBackToList}
            />
          )}
        </ResponsiveContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
