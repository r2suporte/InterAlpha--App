'use client'

import { forwardRef } from 'react'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'

interface ImpressaoOSEntradaProps {
  ordem: OrdemServicoApple
}

export const ImpressaoOSEntrada = forwardRef<HTMLDivElement, ImpressaoOSEntradaProps>(
  ({ ordem }, ref) => {
    const formatDate = (date: Date | string) => {
      const d = new Date(date)
      return d.toLocaleDateString('pt-BR')
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto print:p-4 print:max-w-none">
        {/* Cabeçalho */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">InterAlpha Assistência Técnica</h1>
              <p className="text-gray-600">Especializada em Produtos Apple</p>
              <p className="text-sm text-gray-500">
                Endereço: Rua das Flores, 123 - Centro - São Paulo/SP<br/>
                Telefone: (11) 99999-9999 | Email: contato@interalpha.com.br
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-red-600">ORDEM DE SERVIÇO - ENTRADA</h2>
              <p className="text-lg font-semibold">Nº {ordem.numero}</p>
              <p className="text-sm text-gray-600">Data: {formatDate(ordem.dataRecebimento)}</p>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">DADOS DO CLIENTE</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Nome:</strong> {ordem.cliente.nome}</p>
              <p><strong>Email:</strong> {ordem.cliente.email}</p>
            </div>
            <div>
              <p><strong>Telefone:</strong> {ordem.cliente.telefone || 'Não informado'}</p>
              <p><strong>Endereço:</strong> {ordem.cliente.endereco || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Informações do Dispositivo */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">DADOS DO DISPOSITIVO</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Modelo:</strong> {ordem.dispositivo.modelo}</p>
              <p><strong>Número de Série:</strong> {ordem.dispositivo.numeroSerie}</p>
              <p><strong>Capacidade:</strong> {ordem.dispositivo.capacidade || 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Cor:</strong> {ordem.dispositivo.cor || 'Não informado'}</p>
              <p><strong>IMEI:</strong> {ordem.dispositivo.imei || 'Não informado'}</p>
              <p><strong>Estado Físico:</strong> {ordem.dispositivo.estadoFisico}</p>
            </div>
          </div>
          
          {ordem.dispositivo.acessorios && ordem.dispositivo.acessorios.length > 0 && (
            <div className="mt-3">
              <p><strong>Acessórios Inclusos:</strong></p>
              <div className="flex flex-wrap gap-2 mt-1">
                {ordem.dispositivo.acessorios.map((acessorio, index) => (
                  <span key={index} className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {acessorio}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Problema Relatado */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">PROBLEMA RELATADO</h3>
          <div className="space-y-2">
            <p><strong>Descrição:</strong> {ordem.problema.descricao}</p>
            <p><strong>Frequência:</strong> {ordem.problema.frequencia}</p>
            {ordem.problema.condicoes && (
              <p><strong>Condições:</strong> {ordem.problema.condicoes}</p>
            )}
          </div>
        </div>

        {/* Informações da Garantia */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">INFORMAÇÕES DA GARANTIA</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Tipo:</strong> {ordem.garantia.tipo}</p>
              <p><strong>Período:</strong> {ordem.garantia.periodo} dias</p>
            </div>
            <div>
              <p><strong>Data Início:</strong> {formatDate(ordem.garantia.dataInicio)}</p>
              <p><strong>Data Fim:</strong> {formatDate(ordem.garantia.dataFim)}</p>
            </div>
          </div>
        </div>

        {/* Observações Especiais */}
        {ordem.observacoes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">OBSERVAÇÕES ESPECIAIS</h3>
            <div className="space-y-2">
              {ordem.observacoes.backupNecessario && (
                <p className="text-red-600 font-semibold">⚠️ BACKUP NECESSÁRIO</p>
              )}
              {ordem.observacoes.dadosImportantes && ordem.observacoes.dadosImportantes.length > 0 && (
                <div>
                  <p><strong>Dados Importantes:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    {ordem.observacoes.dadosImportantes.map((dado, index) => (
                      <li key={index}>{dado}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ordem.observacoes.observacoesGerais && (
                <p><strong>Observações Gerais:</strong> {ordem.observacoes.observacoesGerais}</p>
              )}
            </div>
          </div>
        )}

        {/* Orçamento Estimado */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">ORÇAMENTO ESTIMADO</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p><strong>Valor das Peças:</strong></p>
              <p className="text-lg">{formatCurrency(ordem.valorPecas || 0)}</p>
            </div>
            <div>
              <p><strong>Valor da Mão de Obra:</strong></p>
              <p className="text-lg">{formatCurrency(ordem.valorMaoDeObra || 0)}</p>
            </div>
            <div>
              <p><strong>Valor Total:</strong></p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(ordem.valorTotal || 0)}</p>
            </div>
          </div>
        </div>

        {/* Termos e Condições */}
        <div className="mb-8 text-sm">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">TERMOS E CONDIÇÕES</h3>
          <div className="space-y-2">
            <p>• O prazo para retirada do equipamento é de 90 dias após a conclusão do serviço.</p>
            <p>• Equipamentos não retirados no prazo serão considerados abandonados.</p>
            <p>• A garantia do serviço é de {ordem.garantia.periodo} dias para defeitos relacionados ao reparo.</p>
            <p>• Não nos responsabilizamos por dados perdidos durante o reparo.</p>
            <p>• O orçamento tem validade de 30 dias.</p>
          </div>
        </div>

        {/* Campos de Assinatura */}
        <div className="border-t-2 border-gray-300 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 mb-2 h-16"></div>
              <p className="text-center text-sm">
                <strong>Assinatura do Cliente</strong><br/>
                {ordem.cliente.nome}<br/>
                Data: ___/___/______
              </p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-2 h-16"></div>
              <p className="text-center text-sm">
                <strong>Assinatura do Técnico</strong><br/>
                InterAlpha Assistência Técnica<br/>
                Data: ___/___/______
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Este documento comprova o recebimento do equipamento para análise e reparo.</p>
          <p>Guarde este comprovante para retirada do equipamento.</p>
        </div>
      </div>
    )
  }
)

ImpressaoOSEntrada.displayName = 'ImpressaoOSEntrada'