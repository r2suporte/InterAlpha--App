'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import OrdemServicoForm from '@/components/OrdemServicoForm';
import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BackButton } from '@/components/ui/back-button';
import { PageLoading } from '@/components/ui/loading';
import { useLoadingState } from '@/components/ui/loading-states';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/toast-system';
import { OrdemServico, OrdemServicoFormData } from '@/types/ordens-servico';

// Função para converter OrdemServico para OrdemServicoFormData
const convertToFormData = (ordem: OrdemServico): OrdemServicoFormData => {
  return {
    numero_os: ordem.numero_os,
    cliente_id: ordem.cliente_id,
    cliente_portal_id: ordem.cliente_portal_id,
    equipamento_id: ordem.equipamento_id,
    serial_number: ordem.serial_number,
    imei: ordem.imei || '', // Converte undefined para string vazia
    tipo_servico: ordem.tipo_servico || '',
    titulo: ordem.titulo,
    descricao: ordem.descricao,
    problema_reportado: ordem.problema_reportado,
    descricao_defeito: ordem.descricao_defeito,
    estado_equipamento: ordem.estado_equipamento,
    diagnostico_inicial: ordem.diagnostico_inicial || '',
    analise_tecnica: ordem.analise_tecnica || '',
    status: ordem.status,
    prioridade: ordem.prioridade,
    tecnico_id: ordem.tecnico_id || '',
    valor_servico: ordem.valor_servico.toString(),
    valor_pecas: ordem.valor_pecas.toString(),
    data_inicio: ordem.data_inicio || '',
    data_previsao_conclusao: ordem.data_previsao_conclusao || '',
    observacoes_cliente: ordem.observacoes_cliente || '',
    observacoes_tecnico: ordem.observacoes_tecnico || '',
    garantia_servico_dias: ordem.garantia_servico_dias.toString(),
    garantia_pecas_dias: ordem.garantia_pecas_dias.toString(),
  };
};

export default function EditOrdemServicoPage() {
  const params = useParams();
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const { error: showError } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrdem = async () => {
      try {
        startLoading();
        const response = await fetch(`/api/ordens-servico/${params.id}`);

        if (!response.ok) {
          throw new Error('Ordem de serviço não encontrada');
        }

        const data = await response.json();
        setOrdem(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erro ao carregar ordem de serviço';
        setError(errorMessage);
        showError('Erro ao carregar ordem de serviço', errorMessage);
      } finally {
        stopLoading();
      }
    };

    if (params.id) {
      fetchOrdem();
    }
  }, [params.id, startLoading, stopLoading, showError]);

  const handleSave = () => {
    // Aqui você pode implementar a lógica de salvamento
    console.log('Dados salvos');
    // Retornar para página anterior
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <EnhancedSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <PageLoading text="Carregando ordem de serviço..." />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error || !ordem) {
    return (
      <SidebarProvider>
        <EnhancedSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col items-center justify-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Erro ao carregar
            </h2>
            <p className="mb-4 text-gray-600">{error}</p>
            <BackButton href="/dashboard/ordens-servico" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <BackButton href="/dashboard/ordens-servico" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Editar OS {ordem.numero_os}
                </h1>
                <p className="text-gray-600">{ordem.titulo}</p>
              </div>
            </div>

            {/* Formulário */}
            <div className="max-w-4xl">
              <OrdemServicoForm
                ordemServico={convertToFormData(ordem)}
                onSave={handleSave}
                onCancel={() => window.history.back()}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
