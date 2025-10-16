'use client';

import React, { useEffect, useState } from 'react';

import {
  Calculator,
  FileText,
  Package,
  Save,
  User,
  Wrench,
} from 'lucide-react';

import { useTechnicians } from '../hooks/use-technicians';
import { EquipamentoApple } from '../types/equipamentos';
import { formatarMoeda } from '../types/financeiro';
import {
  OrdemServicoFormData,
  PecaUtilizada,
  PrioridadeOrdemServico,
  StatusOrdemServico,
  TipoServico,
} from '../types/ordens-servico';
import PecasOrdemServico from './PecasOrdemServico';
import { FormField } from './form/form-field';

interface OrdemServicoFormProps {
  ordemServico?: OrdemServicoFormData;
  onSave: (_dados: OrdemServicoFormData) => void;
  onSubmit?: (_dados: OrdemServicoFormData) => void;
  onCancel: () => void;
  readonly?: boolean;
}

export default function OrdemServicoForm({
  ordemServico,
  onSave,
  onSubmit,
  onCancel,
  readonly = false,
}: OrdemServicoFormProps) {
  const [formData, setFormData] = useState<OrdemServicoFormData>({
    numero_os: '',
    cliente_id: '',
    equipamento_id: '',
    tipo_servico: 'reparo',
    titulo: '',
    descricao: '',
    problema_reportado: '',
    diagnostico_inicial: '',
    status: 'aberta',
    prioridade: 'media',
    tecnico_id: '',
    valor_servico: '',
    valor_pecas: '',
    data_inicio: '',
    data_previsao_conclusao: '',
    observacoes_cliente: '',
    observacoes_tecnico: '',
    garantia_servico_dias: '',
    garantia_pecas_dias: '',
    // Novos campos para autorizada Apple
    serial_number: '',
    imei: '',
    descricao_defeito: '',
    estado_equipamento: '',
    analise_tecnica: '',
  });

  const [pecasUtilizadas, setPecasUtilizadas] = useState<PecaUtilizada[]>([]);

  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<
    EquipamentoApple[]
  >([]);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Hook para buscar técnicos
  const { loading: loadingTechnicians, getActiveTechnicians } =
    useTechnicians();

  // Simular dados de equipamentos
  useEffect(() => {
    const equipamentosSimulados: EquipamentoApple[] = [
      {
        id: '1',
        tipo: 'ipad',
        modelo: 'iPad Pro 11" 4ª geração (2022)',
        serial_number: 'F2LW48XHQD6R',
        status_garantia: 'ativa_apple',
        fora_garantia: false,
        descricao_problema: 'Tela com riscos leves',
        problemas_identificados: ['Riscos na tela'],
        danos_equipamento: [
          {
            tipo: 'Tela',
            descricao: 'Riscos superficiais',
            severidade: 'baixa',
          },
        ],
        observacoes: 'Cliente relatou queda',
      },
      {
        id: '2',
        tipo: 'ipad',
        modelo: 'iPad 10ª geração (2022)',
        serial_number: 'F2LW48XHQD6S',
        status_garantia: 'expirada',
        fora_garantia: true,
        descricao_problema: 'Tela quebrada',
        problemas_identificados: ['Tela quebrada', 'Touch não funciona'],
        danos_equipamento: [
          {
            tipo: 'Tela',
            descricao: 'Tela completamente quebrada',
            severidade: 'alta',
          },
        ],
        observacoes: 'Necessário troca completa da tela',
      },
    ];
    setEquipamentosDisponiveis(equipamentosSimulados);
  }, []);

  // Carregar dados da ordem de serviço se fornecida
  useEffect(() => {
    if (ordemServico) {
      setFormData(ordemServico);
    }
  }, [ordemServico]);

  // Calcular valor total quando peças ou valor do serviço mudam
  useEffect(() => {
    const valorPecas = pecasUtilizadas.reduce(
      (total: number, peca: PecaUtilizada) => total + peca.valor_total,
      0
    );

    setFormData(prev => ({
      ...prev,
      valor_pecas: valorPecas.toString(),
    }));
  }, [pecasUtilizadas, formData.valor_servico]);

  const handleInputChange = (field: keyof OrdemServicoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (erros[field]) {
      setErros(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handlePecasChange = (pecas: PecaUtilizada[]) => {
    setPecasUtilizadas(pecas);
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.cliente_id) {
      novosErros.cliente_id = 'Cliente é obrigatório';
    }

    if (!formData.equipamento_id) {
      novosErros.equipamento_id = 'Equipamento é obrigatório';
    }

    if (!formData.problema_reportado.trim()) {
      novosErros.problema_reportado = 'Descrição do problema é obrigatória';
    }

    // Validação dos novos campos obrigatórios
    if (!formData.serial_number?.trim()) {
      novosErros.serial_number = 'Número de série é obrigatório';
    } else if (!/^[A-Z0-9]{8,12}$/.test(formData.serial_number)) {
      novosErros.serial_number =
        'Número de série deve ter 8-12 caracteres alfanuméricos';
    }

    if (!formData.descricao_defeito?.trim()) {
      novosErros.descricao_defeito =
        'Descrição detalhada do defeito é obrigatória';
    }

    if (!formData.estado_equipamento?.trim()) {
      novosErros.estado_equipamento =
        'Descrição do estado do equipamento é obrigatória';
    }

    // Validação do IMEI (apenas se preenchido)
    if (formData.imei && formData.imei.trim()) {
      if (!/^[0-9]{15}$/.test(formData.imei)) {
        novosErros.imei = 'IMEI deve conter exatamente 15 dígitos numéricos';
      }
    }

    if (parseFloat(formData.valor_servico) < 0) {
      novosErros.valor_servico = 'Valor do serviço não pode ser negativo';
    }

    if (!formData.data_previsao_conclusao) {
      novosErros.data_previsao_conclusao = 'Data prevista é obrigatória';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setCarregando(true);
    try {
      await onSave(formData);

      if (onSubmit) {
        await onSubmit(formData);
      }

      // Reset form
      setFormData({
        numero_os: '',
        cliente_id: '',
        equipamento_id: '',
        tipo_servico: 'reparo',
        titulo: '',
        descricao: '',
        problema_reportado: '',
        diagnostico_inicial: '',
        status: 'aberta',
        prioridade: 'media',
        tecnico_id: '',
        valor_servico: '',
        valor_pecas: '',
        data_inicio: '',
        data_previsao_conclusao: '',
        observacoes_cliente: '',
        observacoes_tecnico: '',
        garantia_servico_dias: '',
        garantia_pecas_dias: '',
        // Novos campos para autorizada Apple
        serial_number: '',
        imei: '',
        descricao_defeito: '',
        estado_equipamento: '',
        analise_tecnica: '',
      });
      setPecasUtilizadas([]);
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
    } finally {
      setCarregando(false);
    }
  };

  const equipamentoSelecionado = equipamentosDisponiveis.find(
    eq => eq.id === formData.equipamento_id
  );

  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white shadow-lg">
      {/* Cabeçalho */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {ordemServico
                ? 'Editar Ordem de Serviço'
                : 'Nova Ordem de Serviço'}
            </h2>
          </div>

          {readonly && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              Somente Leitura
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-6">
        {/* Informações Básicas */}
        <div className="space-y-6">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Informações Básicas
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FormField label="Cliente *" error={erros.cliente_id}>
                <select
                  value={formData.cliente_id}
                  onChange={e => handleInputChange('cliente_id', e.target.value)}
                  disabled={readonly}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                    erros.cliente_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um cliente</option>
                  <option value="cliente-1">João Silva</option>
                  <option value="cliente-2">Maria Santos</option>
                  <option value="cliente-3">Pedro Oliveira</option>
                </select>
              </FormField>
            </div>

            <div>
              <FormField label="Equipamento *" error={erros.equipamento_id}>
                <select
                  value={formData.equipamento_id}
                  onChange={e =>
                    handleInputChange('equipamento_id', e.target.value)
                  }
                  disabled={readonly}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                    erros.equipamento_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um equipamento</option>
                  {equipamentosDisponiveis.map(equipamento => (
                    <option key={equipamento.id} value={equipamento.id}>
                      {equipamento.modelo}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Técnico Responsável *
              </label>
              <select
                value={formData.tecnico_id}
                onChange={e => handleInputChange('tecnico_id', e.target.value)}
                disabled={readonly || loadingTechnicians}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  erros.tecnico_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um técnico</option>
                {getActiveTechnicians().map(technician => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} (
                    {technician.role === 'supervisor_tecnico'
                      ? 'Supervisor'
                      : 'Técnico'}
                    )
                  </option>
                ))}
              </select>
              {erros.tecnico_id && (
                <p className="mt-1 text-sm text-red-600">{erros.tecnico_id}</p>
              )}
              {loadingTechnicians && (
                <p className="mt-1 text-sm text-gray-500">
                  Carregando técnicos...
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo de Serviço
              </label>
              <select
                value={formData.tipo_servico}
                onChange={e =>
                  handleInputChange(
                    'tipo_servico',
                    e.target.value as TipoServico
                  )
                }
                disabled={readonly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="reparo">Reparo</option>
                <option value="manutencao">Manutenção</option>
                <option value="diagnostico">Diagnóstico</option>
                <option value="upgrade">Upgrade</option>
                <option value="limpeza">Limpeza</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={e =>
                  handleInputChange(
                    'prioridade',
                    e.target.value as PrioridadeOrdemServico
                  )
                }
                disabled={readonly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e =>
                  handleInputChange(
                    'status',
                    e.target.value as StatusOrdemServico
                  )
                }
                disabled={readonly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="aguardando_orcamento">
                  Aguardando Orçamento
                </option>
                <option value="orcamento_aprovado">Orçamento Aprovado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="aguardando_peca">Aguardando Peça</option>
                <option value="concluida">Concluída</option>
                <option value="entregue">Entregue</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Data Prevista de Conclusão *
              </label>
              <input
                type="date"
                value={formData.data_previsao_conclusao}
                onChange={e =>
                  handleInputChange('data_previsao_conclusao', e.target.value)
                }
                disabled={readonly}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  erros.data_previsao_conclusao
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
              />
              {erros.data_previsao_conclusao && (
                <p className="mt-1 text-sm text-red-600">
                  {erros.data_previsao_conclusao}
                </p>
              )}
            </div>
          </div>

          {/* Informações do Equipamento Selecionado */}
          {equipamentoSelecionado && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">
                Detalhes do Equipamento
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-blue-700">Série:</span>
                  <p className="font-medium text-blue-900">
                    {equipamentoSelecionado.serial_number}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Tipo:</span>
                  <p className="font-medium capitalize text-blue-900">
                    {equipamentoSelecionado.tipo}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Garantia:</span>
                  <p className="font-medium capitalize text-blue-900">
                    {equipamentoSelecionado.status_garantia}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Problemas:</span>
                  <p className="font-medium text-blue-900">
                    {equipamentoSelecionado.problemas_identificados.length > 0
                      ? equipamentoSelecionado.problemas_identificados.join(
                          ', '
                        )
                      : 'Nenhum'}
                  </p>
                </div>
              </div>
              {equipamentoSelecionado.observacoes && (
                <div className="mt-2">
                  <span className="text-blue-700">Observações:</span>
                  <p className="font-medium text-blue-900">
                    {equipamentoSelecionado.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informações do Equipamento Apple */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Informações do Equipamento Apple
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Número de Série *
              </label>
              <input
                type="text"
                value={formData.serial_number || ''}
                onChange={e =>
                  handleInputChange(
                    'serial_number',
                    e.target.value.toUpperCase()
                  )
                }
                disabled={readonly}
                placeholder="Ex: F2LXHB0HJGH5"
                maxLength={12}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  erros.serial_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {erros.serial_number && (
                <p className="mt-1 text-sm text-red-600">
                  {erros.serial_number}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Número de série Apple (8-12 caracteres alfanuméricos)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                IMEI (apenas para iPads com celular)
              </label>
              <input
                type="text"
                value={formData.imei || ''}
                onChange={e =>
                  handleInputChange('imei', e.target.value.replace(/\D/g, ''))
                }
                disabled={readonly}
                placeholder="Ex: 123456789012345"
                maxLength={15}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  erros.imei ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {erros.imei && (
                <p className="mt-1 text-sm text-red-600">{erros.imei}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                15 dígitos numéricos (obrigatório apenas para iPads com
                conectividade celular)
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Estado do Equipamento *
            </label>
            <textarea
              value={formData.estado_equipamento || ''}
              onChange={e =>
                handleInputChange('estado_equipamento', e.target.value)
              }
              disabled={readonly}
              rows={3}
              placeholder="Descreva o estado físico do equipamento: riscos, danos, desgaste, etc..."
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                erros.estado_equipamento ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.estado_equipamento && (
              <p className="mt-1 text-sm text-red-600">
                {erros.estado_equipamento}
              </p>
            )}
          </div>
        </div>

        {/* Descrição do Problema */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Descrição do Problema
            </h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Problema Relatado *
            </label>
            <textarea
              value={formData.problema_reportado}
              onChange={e =>
                handleInputChange('problema_reportado', e.target.value)
              }
              disabled={readonly}
              rows={4}
              placeholder="Descreva detalhadamente o problema relatado pelo cliente..."
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                erros.problema_reportado ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.problema_reportado && (
              <p className="mt-1 text-sm text-red-600">
                {erros.problema_reportado}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descrição Detalhada do Defeito *
            </label>
            <textarea
              value={formData.descricao_defeito || ''}
              onChange={e =>
                handleInputChange('descricao_defeito', e.target.value)
              }
              disabled={readonly}
              rows={4}
              placeholder="Descrição técnica detalhada do defeito identificado..."
              className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                erros.descricao_defeito ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {erros.descricao_defeito && (
              <p className="mt-1 text-sm text-red-600">
                {erros.descricao_defeito}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Análise Técnica
            </label>
            <textarea
              value={formData.analise_tecnica || ''}
              onChange={e =>
                handleInputChange('analise_tecnica', e.target.value)
              }
              disabled={readonly}
              rows={4}
              placeholder="Análise técnica detalhada, diagnóstico, causa raiz, procedimentos realizados..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Observações do Técnico
            </label>
            <textarea
              value={formData.observacoes_tecnico}
              onChange={e =>
                handleInputChange('observacoes_tecnico', e.target.value)
              }
              disabled={readonly}
              rows={3}
              placeholder="Observações técnicas adicionais, recomendações, etc..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Peças Utilizadas */}
        <div className="space-y-4">
          <PecasOrdemServico
            ordemServicoId={'nova-os'}
            pecasUtilizadas={pecasUtilizadas}
            onPecasChange={handlePecasChange}
            readonly={readonly}
          />
        </div>

        {/* Valores */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Valores</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Valor do Serviço
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.valor_servico}
                onChange={e =>
                  handleInputChange('valor_servico', e.target.value)
                }
                disabled={readonly}
                className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  erros.valor_servico ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {erros.valor_servico && (
                <p className="mt-1 text-sm text-red-600">
                  {erros.valor_servico}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Valor das Peças
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
                {formatarMoeda(
                  pecasUtilizadas.reduce(
                    (total: number, peca: PecaUtilizada) =>
                      total + peca.valor_total,
                    0
                  )
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Valor Total
              </label>
              <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 font-semibold text-blue-900">
                {formatarMoeda(
                  parseFloat(formData.valor_servico || '0') +
                    pecasUtilizadas.reduce(
                      (total: number, peca: PecaUtilizada) =>
                        total + peca.valor_total,
                      0
                    )
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Garantia (dias)
              </label>
              <input
                type="number"
                min="0"
                value={formData.garantia_servico_dias}
                onChange={e =>
                  handleInputChange('garantia_servico_dias', e.target.value)
                }
                disabled={readonly}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        {!readonly && (
          <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Ordem de Serviço
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
