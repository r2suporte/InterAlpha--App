'use client';

import { useCallback } from 'react';

import { OrdemServico } from '@/types/ordens-servico';

interface UseOrdemAssinaturaProps {
  ordem: OrdemServico;
}

export function useOrdemAssinatura({ ordem }: UseOrdemAssinaturaProps) {
  const handlePrint = useCallback(() => {
    // Abre o PDF gerado pela API em uma nova aba, onde o usuário pode visualizar e imprimir
    window.open(`/api/ordens-servico/${ordem.id}/pdf`, '_blank');
  }, [ordem.id]);

  const handleDownloadPDF = useCallback(() => {
    // Para download, podemos também abrir em nova aba ou criar um link temporário
    // Como a API retorna Content-Disposition: attachment, abrir irá disparar download ou visualização
    window.open(`/api/ordens-servico/${ordem.id}/pdf`, '_blank');
  }, [ordem.id]);

  const generateFileName = useCallback(() => {
    const cliente = ordem.cliente || ordem.cliente_portal;
    const clienteNome =
      cliente?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
    const numeroOS = ordem.numero_os.replace(/[^a-zA-Z0-9]/g, '_');
    const data = new Date().toISOString().split('T')[0];

    return `OS_${numeroOS}_${clienteNome}_${data}.pdf`;
  }, [ordem]);

  const canGenerateSignature = useCallback(() => {
    // Verifica se a ordem está em status que permite gerar assinatura
    const statusPermitidos = [
      'aguardando_aprovacao',
      'aguardando_cliente',
      'em_andamento',
      'em_teste',
      'concluida',
    ];

    return statusPermitidos.includes(ordem.status);
  }, [ordem.status]);

  const getSignatureStatus = useCallback(() => {
    if (ordem.aprovacao_cliente && ordem.assinatura_cliente) {
      return {
        status: 'assinado',
        message: 'Ordem já assinada pelo cliente',
        color: 'green',
      };
    }

    if (ordem.status === 'aguardando_aprovacao') {
      return {
        status: 'pendente',
        message: 'Aguardando assinatura do cliente',
        color: 'yellow',
      };
    }

    if (canGenerateSignature()) {
      return {
        status: 'disponivel',
        message: 'Disponível para assinatura',
        color: 'blue',
      };
    }

    return {
      status: 'indisponivel',
      message: 'Assinatura não disponível para este status',
      color: 'gray',
    };
  }, [ordem, canGenerateSignature]);

  return {
    handlePrint,
    handleDownloadPDF,
    generateFileName,
    canGenerateSignature,
    getSignatureStatus,
    signatureInfo: getSignatureStatus(),
  };
}
