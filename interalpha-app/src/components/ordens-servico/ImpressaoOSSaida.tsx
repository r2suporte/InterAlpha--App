'use client'

import { forwardRef } from 'react'
import { OrdemServicoApple } from '@/types/ordem-servico-apple'

interface ImpressaoOSSaidaProps {
  ordem: OrdemServicoApple
}

export const ImpressaoOSSaida = forwardRef<HTMLDivElement, ImpressaoOSSaidaProps>(
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
              <h2 className="text-xl font-bold text-green-600">ORDEM DE SERVIÇO - SAÍDA</h2>
              <p className="text-lg font-semibold">Nº {ordem.numero}</p>
              <p className="text-sm text-gray-600">Data Entrada: {formatDate(ordem.dataRecebimento)}</p>
              <p className="text-sm text-gray-600">Data Conclusão: {ordem.dataConclusao ? formatDate(ordem.dataConclusao) : 'Não informado'}</p>
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
              <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{ordem.status}</span></p>
            </div>
            <div>
              <p><strong>Técnico Responsável:</strong> {ordem.tecnicoResponsavel || 'Não informado'}</p>
              <p><strong>Capacidade:</strong> {ordem.dispositivo.capacidade || 'Não informado'}</p>
              <p><strong>Cor:</strong> {ordem.dispositivo.cor || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* Serviços Realizados */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">SERVIÇOS REALIZADOS</h3>
          {ordem.acoes && ordem.acoes.length > 0 ? (
            <div className="space-y-3">
              {ordem.acoes.map((acao, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p><strong>Ação {index + 1}:</strong> {acao.descricao}</p>
                  <p className="text-sm text-gray-600">
                    Técnico: {acao.tecnico} | 
                    Data: {formatDate(acao.dataHora)} | 
                    Tempo: {acao.tempo} min | 
                    Resultado: <span className={`font-semibold ${
                      acao.resultado === 'Sucesso' ? 'text-green-600' : 
                      acao.resultado === 'Falha' ? 'text-red-600' : 'text-yellow-600'
                    }`}>{acao.resultado}</span>
                  </p>
                  {acao.observacoes && (
                    <p className="text-sm text-gray-700 mt-1">Obs: {acao.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum serviço registrado</p>
          )}
        </div>

        {/* Peças Substituídas */}
        {ordem.pecasSubstituidas && ordem.pecasSubstituidas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">PEÇAS SUBSTITUÍDAS</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Código</th>
                    <th className="border border-gray-300 p-2 text-left">Descrição</th>
                    <th className="border border-gray-300 p-2 text-left">Categoria</th>
                    <th className="border border-gray-300 p-2 text-right">Valor</th>
                    <th className="border border-gray-300 p-2 text-center">Garantia</th>
                  </tr>
                </thead>
                <tbody>
                  {ordem.pecasSubstituidas.map((peca, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{peca.codigo}</td>
                      <td className="border border-gray-300 p-2">{peca.nome}</td>
                      <td className="border border-gray-300 p-2">{peca.categoria}</td>
                      <td className="border border-gray-300 p-2 text-right">{formatCurrency(peca.preco)}</td>
                      <td className="border border-gray-300 p-2 text-center">{peca.garantia} dias</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Valores Finais */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">VALORES DO SERVIÇO</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Valor das Peças:</span>
                <span>{formatCurrency(ordem.valorPecas || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor da Mão de Obra:</span>
                <span>{formatCurrency(ordem.valorMaoDeObra || 0)}</span>
              </div>
              {ordem.desconto && ordem.desconto > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(ordem.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span className="text-green-600">{formatCurrency(ordem.valorTotal || 0)}</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Informações de Garantia:</h4>
              <p className="text-sm">Tipo: {ordem.garantia.tipo}</p>
              <p className="text-sm">Período: {ordem.garantia.periodo} dias</p>
              <p className="text-sm">Válida até: {formatDate(ordem.garantia.dataFim)}</p>
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {ordem.observacoes?.recomendacoes && ordem.observacoes.recomendacoes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">RECOMENDAÇÕES TÉCNICAS</h3>
            <ul className="list-disc list-inside space-y-1">
              {ordem.observacoes.recomendacoes.map((recomendacao, index) => (
                <li key={index} className="text-sm">{recomendacao}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Termos da Garantia */}
        <div className="mb-8 text-sm">
          <h3 className="text-lg font-semibold mb-3 bg-gray-100 p-2">TERMOS DA GARANTIA</h3>
          <div className="space-y-2">
            <p>• A garantia do serviço é de {ordem.garantia.periodo} dias para defeitos relacionados ao reparo realizado.</p>
            <p>• A garantia não cobre danos causados por mau uso, quedas, líquidos ou outros fatores externos.</p>
            <p>• Para acionamento da garantia, apresente este comprovante.</p>
            <p>• Peças substituídas possuem garantia individual conforme especificado na tabela acima.</p>
            <p>• A garantia é válida apenas para o defeito original reparado.</p>
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
                Data: ___/___/______<br/>
                <span className="text-xs">Declaro ter recebido o equipamento em perfeitas condições</span>
              </p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-2 h-16"></div>
              <p className="text-center text-sm">
                <strong>Assinatura do Técnico</strong><br/>
                InterAlpha Assistência Técnica<br/>
                Data: ___/___/______<br/>
                <span className="text-xs">Responsável pela entrega</span>
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Serviço concluído com sucesso. Obrigado pela confiança!</p>
          <p>Em caso de dúvidas, entre em contato: (11) 99999-9999</p>
        </div>
      </div>
    )
  }
)

ImpressaoOSSaida.displayName = 'ImpressaoOSSaida'