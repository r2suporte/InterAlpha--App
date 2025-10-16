'use client';

import React, { useRef } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  Hash,
  Printer,
  Shield,
  Smartphone,
  User,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatarMoeda } from '@/types/financeiro';
import {
  LABELS_PRIORIDADE,
  LABELS_STATUS_OS,
  LABELS_TIPO_SERVICO,
  OrdemServico,
} from '@/types/ordens-servico';

interface OrdemAssinaturaClienteProps {
  ordem: OrdemServico;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function OrdemAssinaturaCliente({
  ordem,
  onPrint,
  onDownload,
}: OrdemAssinaturaClienteProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  const dataAtual = new Date();
  const cliente = ordem.cliente || ordem.cliente_portal;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Cabeçalho com ações */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Ordem de Serviço para Assinatura
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Documento para impressão */}
      <div
        ref={componentRef}
        className="bg-white p-8 shadow-lg print:p-0 print:shadow-none"
      >
        {/* Cabeçalho da empresa */}
        <div className="mb-8 border-b-2 border-blue-600 pb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-blue-600">
            InterAlpha Assistência Técnica
          </h1>
          <p className="text-gray-600">Especializada em Produtos Apple</p>
          <p className="mt-2 text-sm text-gray-500">
            Rua Exemplo, 123 - Centro - São Paulo/SP - CEP: 01234-567
          </p>
          <p className="text-sm text-gray-500">
            Tel: (11) 1234-5678 | Email: contato@interalpha.com.br
          </p>
        </div>

        {/* Título do documento */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            ORDEM DE SERVIÇO
          </h2>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 text-lg">
              <Hash className="mr-2 h-4 w-4" />
              {ordem.numero_os}
            </Badge>
            <Badge
              className={`px-4 py-2 text-lg ${
                ordem.status === 'aguardando_aprovacao'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {LABELS_STATUS_OS[ordem.status]}
            </Badge>
          </div>
        </div>

        {/* Informações do cliente e equipamento */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Nome:</span>{' '}
                {cliente?.nome || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span>{' '}
                {cliente?.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Telefone:</span>{' '}
                {cliente?.telefone || 'N/A'}
              </div>
              {ordem.cliente && (
                <>
                  <div>
                    <span className="font-medium">CPF/CNPJ:</span>{' '}
                    {ordem.cliente.cpf_cnpj || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Endereço:</span>{' '}
                    {ordem.cliente.endereco || 'N/A'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dados do Equipamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-blue-600" />
                Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Tipo:</span>{' '}
                {ordem.equipamento?.tipo || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Modelo:</span>{' '}
                {ordem.equipamento?.modelo || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Serial:</span>{' '}
                {ordem.serial_number}
              </div>
              {ordem.imei && (
                <div>
                  <span className="font-medium">IMEI:</span> {ordem.imei}
                </div>
              )}
              <div>
                <span className="font-medium">Estado:</span>{' '}
                {ordem.estado_equipamento}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Serviço */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-blue-600" />
              Detalhes do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="font-medium">Tipo de Serviço:</span>{' '}
                {LABELS_TIPO_SERVICO[ordem.tipo_servico]}
              </div>
              <div>
                <span className="font-medium">Prioridade:</span>{' '}
                {LABELS_PRIORIDADE[ordem.prioridade]}
              </div>
            </div>
            <div>
              <span className="font-medium">Título:</span> {ordem.titulo}
            </div>
            <div>
              <span className="font-medium">Problema Reportado:</span>
              <p className="mt-1 text-gray-700">{ordem.problema_reportado}</p>
            </div>
            <div>
              <span className="font-medium">Descrição do Defeito:</span>
              <p className="mt-1 text-gray-700">{ordem.descricao_defeito}</p>
            </div>
            {ordem.diagnostico_inicial && (
              <div>
                <span className="font-medium">Diagnóstico Inicial:</span>
                <p className="mt-1 text-gray-700">
                  {ordem.diagnostico_inicial}
                </p>
              </div>
            )}
            {ordem.analise_tecnica && (
              <div>
                <span className="font-medium">Análise Técnica:</span>
                <p className="mt-1 text-gray-700">{ordem.analise_tecnica}</p>
              </div>
            )}
            {ordem.solucao_aplicada && (
              <div>
                <span className="font-medium">Solução Aplicada:</span>
                <p className="mt-1 text-gray-700">{ordem.solucao_aplicada}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valores e Datas */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Valores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Mão de Obra:</span>
                <span className="font-medium">
                  {formatarMoeda(ordem.valor_servico)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Peças:</span>
                <span className="font-medium">
                  {formatarMoeda(ordem.valor_pecas)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-blue-600">
                  {formatarMoeda(ordem.valor_total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Datas e Garantia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                Prazos e Garantia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Data de Abertura:</span>{' '}
                {format(new Date(ordem.data_abertura), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </div>
              {ordem.data_previsao_conclusao && (
                <div>
                  <span className="font-medium">Previsão de Conclusão:</span>{' '}
                  {format(
                    new Date(ordem.data_previsao_conclusao),
                    'dd/MM/yyyy',
                    { locale: ptBR }
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Garantia do Serviço:</span>{' '}
                {ordem.garantia_servico_dias} dias
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="font-medium">Garantia das Peças:</span>{' '}
                {ordem.garantia_pecas_dias} dias
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        {(ordem.observacoes_cliente || ordem.observacoes_tecnico) && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordem.observacoes_cliente && (
                <div>
                  <span className="font-medium">Observações do Cliente:</span>
                  <p className="mt-1 text-gray-700">
                    {ordem.observacoes_cliente}
                  </p>
                </div>
              )}
              {ordem.observacoes_tecnico && (
                <div>
                  <span className="font-medium">Observações Técnicas:</span>
                  <p className="mt-1 text-gray-700">
                    {ordem.observacoes_tecnico}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Termos e Condições */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Termos e Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>
              1. O cliente autoriza a execução dos serviços descritos nesta
              ordem de serviço.
            </p>
            <p>
              2. Os valores apresentados são válidos por 30 dias a partir da
              data desta ordem.
            </p>
            <p>
              3. A garantia do serviço é de {ordem.garantia_servico_dias} dias e
              das peças de {ordem.garantia_pecas_dias} dias, contados a partir
              da data de entrega do equipamento.
            </p>
            <p>
              4. O equipamento deverá ser retirado em até 30 dias após a
              conclusão do serviço, caso contrário será cobrada taxa de
              armazenamento.
            </p>
            <p>
              5. A empresa não se responsabiliza por dados perdidos durante o
              processo de reparo.
            </p>
            <p>
              6. O pagamento deverá ser efetuado na retirada do equipamento.
            </p>
          </CardContent>
        </Card>

        {/* Área de Assinatura */}
        <div className="mb-8 rounded-lg border-2 border-gray-300 p-6">
          <h3 className="mb-4 text-center text-lg font-bold">
            AUTORIZAÇÃO E ASSINATURA DO CLIENTE
          </h3>

          <div className="mb-6 space-y-4">
            <p className="text-sm text-gray-700">
              Eu, <strong>{cliente?.nome || '_'.repeat(50)}</strong>, autorizo a
              execução dos serviços descritos nesta ordem de serviço, estando
              ciente dos valores, prazos e condições apresentados.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="text-center">
              <div className="mb-2 h-16 border-b border-gray-400"></div>
              <p className="text-sm font-medium">Assinatura do Cliente</p>
              <p className="text-xs text-gray-500">
                Data: {format(dataAtual, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>

            <div className="text-center">
              <div className="mb-2 h-16 border-b border-gray-400"></div>
              <p className="text-sm font-medium">
                Assinatura do Responsável Técnico
              </p>
              <p className="text-xs text-gray-500">
                {ordem.tecnico_nome || 'InterAlpha Assistência Técnica'}
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t pt-4 text-center text-xs text-gray-500">
          <p>
            Este documento foi gerado em{' '}
            {format(dataAtual, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="mt-1">
            InterAlpha Assistência Técnica - CNPJ: 12.345.678/0001-90
          </p>
        </div>
      </div>
    </div>
  );
}
