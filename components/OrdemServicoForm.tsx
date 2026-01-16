'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Calculator,
  FileText,
  Save,
  User,
  Wrench,
  Smartphone,
} from 'lucide-react';

import { useClients } from '../hooks/use-clients'; // Keeping for type if needed
import { useTechnicians } from '../hooks/use-technicians';
import { formatarMoeda } from '../types/financeiro';
import {
  OrdemServicoFormData,
  PecaUtilizada,
  Cliente
} from '../types/ordens-servico';
import PecasOrdemServico from './PecasOrdemServico';
import { FormField } from './form/form-field';
import { ClientSearch } from '@/components/client-search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Equipment Type
interface Equipamento {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  imei?: string;
  observacoes?: string;
}

interface OrdemServicoFormProps {
  ordemServico?: OrdemServicoFormData & { id?: string }; // Extend to allow ID
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
    tipo_dispositivo: '',
    modelo_dispositivo: '',
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
    garantia_servico_dias: '90',
    garantia_pecas_dias: '90',
    serial_number: '',
    imei: '',
    descricao_defeito: '',
    estado_equipamento: '',
    analise_tecnica: '',
  });

  const [pecasUtilizadas, setPecasUtilizadas] = useState<PecaUtilizada[]>([]);
  const [equipamentosCliente, setEquipamentosCliente] = useState<Equipamento[]>([]);
  const [modoNovoEquipamento, setModoNovoEquipamento] = useState(false);
  const [salvarNovoEquipamento, setSalvarNovoEquipamento] = useState(true);

  const [carregando, setCarregando] = useState(false);
  const [carregandoEquipamentos, setCarregandoEquipamentos] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const { loading: loadingTechnicians, getActiveTechnicians } = useTechnicians();

  // Load initial data
  useEffect(() => {
    if (ordemServico) {
      setFormData(ordemServico);
      // If editing, we might need to load equipment list if client is set
      if (ordemServico.cliente_id) {
        fetchEquipamentosCliente(ordemServico.cliente_id);
      }
    }
  }, [ordemServico]);

  // Fetch equipments when client changes
  useEffect(() => {
    if (formData.cliente_id && !ordemServico) { // Only auto-fetch if not editing initial load (handled above)
      fetchEquipamentosCliente(formData.cliente_id);
    } else if (!formData.cliente_id) {
      setEquipamentosCliente([]);
    }
  }, [formData.cliente_id]);

  const fetchEquipamentosCliente = async (clienteId: string) => {
    setCarregandoEquipamentos(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/equipamentos`);
      if (res.ok) {
        const data = await res.json();
        setEquipamentosCliente(data);
      }
    } catch (e) {
      console.error("Erro ao buscar equipamentos", e);
    } finally {
      setCarregandoEquipamentos(false);
    }
  };

  // Update total value
  useEffect(() => {
    const valorPecas = pecasUtilizadas.reduce(
      (total: number, peca: PecaUtilizada) => total + peca.valor_total,
      0
    );
    // Update form data if mismatch to ensure consistency
    if (formData.valor_pecas !== valorPecas.toString()) {
      setFormData(prev => ({ ...prev, valor_pecas: valorPecas.toString() }));
    }
  }, [pecasUtilizadas]);

  const valorTotal = React.useMemo(() => {
    const valorPecas = parseFloat(formData.valor_pecas || '0');
    return parseFloat(formData.valor_servico || '0') + valorPecas;
  }, [formData.valor_pecas, formData.valor_servico]);


  const handleInputChange = useCallback((field: keyof OrdemServicoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setErros(prev => {
      const newErros = { ...prev };
      delete newErros[field];
      return newErros;
    });
  }, []);

  const handleClientSelect = (cliente: Cliente) => {
    handleInputChange('cliente_id', cliente.id);
    // Reset equipment selection
    handleInputChange('equipamento_id', '');
    setModoNovoEquipamento(false);
  };

  const handleEquipamentoSelect = (equipamentoId: string) => {
    if (equipamentoId === 'new') {
      setModoNovoEquipamento(true);
      handleInputChange('equipamento_id', '');
      // Clear fields for typing
      handleInputChange('tipo_dispositivo', '');
      handleInputChange('modelo_dispositivo', '');
      handleInputChange('serial_number', '');
      handleInputChange('imei', '');
      handleInputChange('estado_equipamento', '');
    } else {
      setModoNovoEquipamento(false);
      handleInputChange('equipamento_id', equipamentoId);
      // Populate fields
      const eq = equipamentosCliente.find(e => e.id === equipamentoId);
      if (eq) {
        handleInputChange('tipo_dispositivo', eq.tipo);
        handleInputChange('modelo_dispositivo', eq.modelo);
        handleInputChange('serial_number', eq.numeroSerie || '');
        handleInputChange('imei', eq.imei || '');
        // Note: Estado is per OS, usually, not persistent on equipment unless updated?
        // Only pull if empty? No, better rewrite if explicitly selecting equipment.
      }
    }
  };

  const criarEquipamento = async () => {
    if (!formData.tipo_dispositivo || !formData.modelo_dispositivo) return null;
    try {
      const res = await fetch('/api/equipamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: formData.cliente_id,
          tipo: formData.tipo_dispositivo,
          modelo: formData.modelo_dispositivo,
          numeroSerie: formData.serial_number,
          marca: '', // We don't have separate brand field in OS form yet, assume implicit or map
          imei: formData.imei,
          estado: formData.estado_equipamento
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Erro ao criar equipamento", e);
    }
    return null;
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.cliente_id) novosErros.cliente_id = 'Cliente é obrigatório';
    if (!formData.descricao?.trim()) novosErros.descricao = 'Descrição requerida';
    // Usually 'problema_reportado' is used.
    if (!formData.problema_reportado?.trim()) novosErros.problema_reportado = 'Problema reportado é obrigatório';

    if (!formData.tipo_dispositivo) novosErros.tipo_dispositivo = 'Tipo de dispositivo é obrigatório';
    if (!formData.modelo_dispositivo) novosErros.modelo_dispositivo = 'Modelo é obrigatório';

    if (!formData.serial_number?.trim()) {
      // Is serial mandatory? User requirements say "Risk: no tracking".
      // So verify serial if possible.
      // novosErros.serial_number = 'Serial é obrigatório';
    }

    if (!formData.data_previsao_conclusao) novosErros.data_previsao_conclusao = 'Previsão de conclusão obrigatória';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setCarregando(true);
    try {
      let finalEquipamentoId = formData.equipamento_id;

      // Auto-create equipment if new mode and checkbox checked
      if (modoNovoEquipamento && salvarNovoEquipamento && !finalEquipamentoId) {
        const novoEq = await criarEquipamento();
        if (novoEq) {
          finalEquipamentoId = novoEq.id;
        }
      }

      const dataToSubmit = {
        ...formData,
        equipamento_id: finalEquipamentoId,
        pecas: pecasUtilizadas.map(p => ({
          id: p.id.startsWith('temp-') ? p.peca_id || p.id : p.id,
          nome: p.nome,
          quantidade: p.quantidade,
          valor_unitario: p.valor_unitario
        }))
      };

      await onSave(dataToSubmit);
      if (onSubmit) await onSubmit(dataToSubmit);

    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl rounded-xl bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">
                {ordemServico ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h2>
              <p className="text-blue-100 text-sm">Preencha os dados abaixo para registrar o serviço</p>
            </div>
          </div>
          {readonly && (
            <span className="rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium">
              Somente Leitura
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">

        {/* Section: Cliente & Equipamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Cliente */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <User className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Cliente</h3>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Selecione o Cliente *</label>
                <ClientSearch
                  onClientSelect={handleClientSelect}
                  selectedClienteId={formData.cliente_id}
                />
                {erros.cliente_id && <p className="text-red-500 text-sm mt-1">{erros.cliente_id}</p>}
              </div>
            </div>
          </div>

          {/* Equipamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Smartphone className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Equipamento</h3>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
              {!formData.cliente_id ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  <User className="h-8 w-8 mb-2 opacity-20" />
                  Selecione um cliente primeiro
                </div>
              ) : (
                <>
                  {/* Equipment Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Dispositivo *</label>
                    <select
                      className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={modoNovoEquipamento ? 'new' : (formData.equipamento_id || 'new')}
                      onChange={(e) => handleEquipamentoSelect(e.target.value)}
                      disabled={readonly || carregandoEquipamentos}
                    >
                      <option value="new">+ Novo Equipamento / Não Cadastrado</option>
                      {equipamentosCliente.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.tipo} {eq.modelo} - {eq.numeroSerie ? `S/N: ${eq.numeroSerie}` : 'Sem S/N'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Equipment Fields */}
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormField label="Tipo *" error={erros.tipo_dispositivo}>
                      <input
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                        placeholder="Ex: iPhone"
                        value={formData.tipo_dispositivo || ''}
                        onChange={e => handleInputChange('tipo_dispositivo', e.target.value)}
                        disabled={readonly || (!modoNovoEquipamento && !!formData.equipamento_id)}
                      />
                    </FormField>
                    <FormField label="Modelo *" error={erros.modelo_dispositivo}>
                      <input
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                        placeholder="Ex: 13 Pro"
                        value={formData.modelo_dispositivo || ''}
                        onChange={e => handleInputChange('modelo_dispositivo', e.target.value)}
                        disabled={readonly || (!modoNovoEquipamento && !!formData.equipamento_id)}
                      />
                    </FormField>
                    <FormField label="Serial Number" error={erros.serial_number}>
                      <input
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono"
                        placeholder="S/N"
                        value={formData.serial_number || ''}
                        onChange={e => handleInputChange('serial_number', e.target.value.toUpperCase())}
                        disabled={readonly || (!modoNovoEquipamento && !!formData.equipamento_id)}
                      />
                    </FormField>
                    <FormField label="IMEI">
                      <input
                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-mono"
                        placeholder="Opcional"
                        value={formData.imei || ''}
                        onChange={e => handleInputChange('imei', e.target.value)}
                        disabled={readonly || (!modoNovoEquipamento && !!formData.equipamento_id)}
                      />
                    </FormField>
                  </div>

                  {/* Save Option */}
                  {modoNovoEquipamento && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <input
                        type="checkbox"
                        id="saveEq"
                        checked={salvarNovoEquipamento}
                        onChange={e => setSalvarNovoEquipamento(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="saveEq" className="text-sm text-gray-600">
                        Salvar este equipamento no cadastro do cliente
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section: Detalhes do Serviço */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-blue-700 border-b pb-2">
            <Wrench className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Detalhes do Serviço</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <FormField label="Problema Relatado *" error={erros.problema_reportado} className="md:col-span-2">
              <textarea
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm min-h-[80px]"
                placeholder="Descreva o problema relatado pelo cliente..."
                value={formData.problema_reportado || ''}
                onChange={e => handleInputChange('problema_reportado', e.target.value)}
                disabled={readonly}
              />
            </FormField>

            <FormField label="Estado do Equipamento" error={erros.estado_equipamento} className="md:col-span-2">
              <textarea
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm min-h-[60px]"
                placeholder="Riscos, amassados, ou condições pré-existentes..."
                value={formData.estado_equipamento || ''}
                onChange={e => handleInputChange('estado_equipamento', e.target.value)}
                disabled={readonly}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tipo de Serviço">
                <select
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                  value={formData.tipo_servico}
                  onChange={e => handleInputChange('tipo_servico', e.target.value)}
                  disabled={readonly}
                >
                  <option value="reparo">Reparo</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="upgrade">Upgrade</option>
                  <option value="limpeza">Limpeza</option>
                </select>
              </FormField>

              <FormField label="Prioridade">
                <select
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                  value={formData.prioridade}
                  onChange={e => handleInputChange('prioridade', e.target.value)}
                  disabled={readonly}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Status">
                <select
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                  disabled={readonly}
                >
                  <option value="aberta">Aberta</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_peca">Aguardando Peça</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </FormField>

              <FormField label="Previsão Entrega *" error={erros.data_previsao_conclusao}>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                  value={formData.data_previsao_conclusao || ''}
                  onChange={e => handleInputChange('data_previsao_conclusao', e.target.value)}
                  disabled={readonly}
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Técnico Responsável" error={erros.tecnico_id}>
                <select
                  className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                  value={formData.tecnico_id || ''}
                  onChange={e => handleInputChange('tecnico_id', e.target.value)}
                  disabled={readonly || loadingTechnicians}
                >
                  <option value="">Selecione...</option>
                  {getActiveTechnicians().map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        </div>

        {/* Section: Peças */}
        <div className="space-y-6">
          <PecasOrdemServico
            ordemServicoId={ordemServico?.id || 'nova-os'}
            pecasUtilizadas={pecasUtilizadas}
            onPecasChange={setPecasUtilizadas}
            readonly={readonly}
          />
        </div>

        {/* Section: Valores */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-blue-700 mb-6">
            <Calculator className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Valores e Garantia</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Mão de Obra (R$)">
              <input
                type="number" step="0.01" min="0"
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm font-medium"
                value={formData.valor_servico}
                onChange={e => handleInputChange('valor_servico', e.target.value)}
                disabled={readonly}
              />
            </FormField>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Valor Peças</label>
              <div className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                {formatarMoeda(parseFloat(formData.valor_pecas || '0'))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">Valor Total</label>
              <div className="w-full px-3 py-2 text-lg font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
                {formatarMoeda(valorTotal)}
              </div>
            </div>

            <FormField label="Garantia Serviço (Dias)">
              <input type="number"
                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                value={formData.garantia_servico_dias}
                onChange={e => handleInputChange('garantia_servico_dias', e.target.value)}
                disabled={readonly}
              />
            </FormField>
          </div>
        </div>

        {/* Actions */}
        {!readonly && (
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={carregando}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {carregando ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar OS
                </>
              )}
            </Button>
          </div>
        )}

      </form>
    </div>
  );
}
