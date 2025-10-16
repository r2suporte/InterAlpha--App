'use client';

import { useState } from 'react';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileSignature,
  FileText,
  MoreVertical,
  Printer,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrdemAssinatura } from '@/hooks/use-ordem-assinatura';
import { OrdemServico } from '@/types/ordens-servico';

import OrdemAssinaturaCliente from '../OrdemAssinaturaCliente';

interface OrdemServicoActionsProps {
  ordem: OrdemServico;
  onUpdate?: (_ordem: OrdemServico) => void;
}

export function OrdemServicoActions({
  ordem,
  _onUpdate,
}: OrdemServicoActionsProps) {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const {
    handlePrint,
    handleDownloadPDF,
    signatureInfo,
    canGenerateSignature,
  } = useOrdemAssinatura({ ordem });

  const getStatusIcon = () => {
    switch (signatureInfo.status) {
      case 'assinado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'disponivel':
        return <FileSignature className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (signatureInfo.status) {
      case 'assinado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disponivel':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status da Assinatura */}
      <Badge
        variant="outline"
        className={`flex items-center gap-1 ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span className="text-xs">{signatureInfo.message}</span>
      </Badge>

      {/* Botão Principal - Gerar Assinatura */}
      {canGenerateSignature() && (
        <Dialog
          open={showSignatureDialog}
          onOpenChange={setShowSignatureDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant={
                signatureInfo.status === 'assinado' ? 'outline' : 'default'
              }
              size="sm"
              className="flex items-center gap-2"
            >
              <FileSignature className="h-4 w-4" />
              {signatureInfo.status === 'assinado'
                ? 'Ver Assinatura'
                : 'Gerar Assinatura'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ordem de Serviço para Assinatura - OS {ordem.numero_os}
              </DialogTitle>
            </DialogHeader>
            <OrdemAssinaturaCliente ordem={ordem} />

            {/* Botões de Ação no Dialog */}
            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => setShowSignatureDialog(false)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Menu de Ações Secundárias */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ordem
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          {canGenerateSignature() && (
            <DropdownMenuItem
              onClick={() => setShowSignatureDialog(true)}
              className="flex items-center gap-2"
            >
              <FileSignature className="h-4 w-4" />
              {signatureInfo.status === 'assinado'
                ? 'Ver Assinatura'
                : 'Gerar Assinatura'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
