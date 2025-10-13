'use client';

import { useCallback } from 'react';

import { OrdemServico } from '@/types/ordens-servico';

interface UseOrdemAssinaturaProps {
  ordem: OrdemServico;
}

export function useOrdemAssinatura({ ordem }: UseOrdemAssinaturaProps) {
  const handlePrint = useCallback(() => {
    // Configurações específicas para impressão
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          @page { 
            margin: 1cm; 
            size: A4;
          }
        }
      </style>
    `;

    // Adiciona estilos de impressão temporariamente
    const styleElement = document.createElement('style');
    styleElement.innerHTML = printStyles;
    document.head.appendChild(styleElement);

    // Executa a impressão
    window.print();

    // Remove os estilos após a impressão
    setTimeout(() => {
      document.head.removeChild(styleElement);
    }, 1000);
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    try {
      // Para implementação futura com biblioteca de PDF
      // Por enquanto, abre a janela de impressão que permite salvar como PDF
      const printStyles = `
        <style>
          @media print {
            body { margin: 0; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:p-0 { padding: 0 !important; }
            @page { 
              margin: 1cm; 
              size: A4;
            }
          }
        </style>
      `;

      const styleElement = document.createElement('style');
      styleElement.innerHTML = printStyles;
      document.head.appendChild(styleElement);

      // Abre a janela de impressão (usuário pode escolher "Salvar como PDF")
      window.print();

      setTimeout(() => {
        document.head.removeChild(styleElement);
      }, 1000);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      // Fallback para impressão normal
      handlePrint();
    }
  }, [handlePrint]);

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
