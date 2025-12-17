'use client';

import React, { useEffect, useState } from 'react';

import { DollarSign, Loader2, Package, Settings, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  calcularMargemLucro,
  calcularPrecoVenda,
  formatarMoeda
} from '@/lib/utils/pricing';
import { validarPartNumber } from '@/lib/utils/pecas';
import {
  CATEGORIA_PECA_LABELS,
  CategoriaPeca,
  Fornecedor,
  Peca,
  STATUS_PECA_LABELS,
  StatusPeca,
} from '@/types/pecas';

const DEFAULT_WARRANTY_MONTHS = '12';
const DEFAULT_MARGIN_PERCENTAGE = 30;
const HIGH_MARGIN_THRESHOLD = 30;
const MEDIUM_MARGIN_THRESHOLD = 15;

interface PecaFormData {
  part_number: string;
  nome: string;
  descricao: string;
  categoria: CategoriaPeca | '';
  fornecedor_id: string;
  preco_custo: string;
  preco_venda: string;
  estoque_minimo: string;
  estoque_atual: string;
  localizacao: string;
  observacoes: string;
  status: StatusPeca;
  peso: string;
  dimensoes: string;
  garantia_meses: string;
}

interface PecaFormProps {
  peca?: Peca;
  onSubmit: (_data: PecaFormData) => Promise<void>;
  onCancel: () => void;
  fornecedores: Fornecedor[];
  isLoading?: boolean;
}

export default function PecaForm({
  peca,
  onSubmit,
  onCancel,
  fornecedores,
  isLoading = false,
}: PecaFormProps) {
  const [formData, setFormData] = useState<PecaFormData>({
    part_number: '',
    nome: '',
    descricao: '',
    categoria: '' as CategoriaPeca,
    fornecedor_id: '',
    preco_custo: '',
    preco_venda: '',
    estoque_minimo: '',
    estoque_atual: '',
    localizacao: '',
    observacoes: '',
    status: 'ativo' as StatusPeca, // Check if 'ativo' is valid in StatusPeca, typical enum might be 'disponivel' etc. Assuming 'ativo' maps to one of them or default.
    peso: '',
    dimensoes: '',
    garantia_meses: DEFAULT_WARRANTY_MONTHS,
  });

  // Set default status correctly if needed based on type definition
  // StatusPeca = 'disponivel' | 'baixo_estoque' | 'sem_estoque' | 'descontinuada' | 'em_pedido'
  useEffect(() => {
    if (!peca) {
      setFormData(prev => ({ ...prev, status: 'disponivel' }));
    }
  }, [peca]);


  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partNumberValidation, setPartNumberValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  // Preencher formulário se editando
  useEffect(() => {
    if (peca) {
      setFormData({
        part_number: peca.part_number,
        nome: peca.nome,
        descricao: peca.descricao,
        categoria: peca.categoria,
        fornecedor_id: peca.fornecedor_id || '',
        preco_custo: peca.preco_custo.toString(),
        preco_venda: peca.preco_venda.toString(),
        estoque_minimo: peca.estoque_minimo.toString(),
        estoque_atual: peca.quantidade_estoque.toString(),
        localizacao: peca.localizacao_estoque || '',
        observacoes: '',
        status: peca.status,
        peso: '', // Add mapping if available
        dimensoes: '', // Add mapping if available
        garantia_meses: (peca.garantia_meses || parseInt(DEFAULT_WARRANTY_MONTHS)).toString(),
      });
    }
  }, [peca]);

  // Calcular margem de lucro
  const margem = React.useMemo(() => {
    const custo = parseFloat(formData.preco_custo);
    const venda = parseFloat(formData.preco_venda);

    if (custo > 0 && venda > 0) {
      const percentual = calcularMargemLucro(custo, venda);
      const valor = venda - custo;
      return {
        percentual,
        valor,
      };
    }
    return null;
  }, [formData.preco_custo, formData.preco_venda]);

  // Validar part number
  const handlePartNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, part_number: value }));

    const validation = validarPartNumber(value);
    setPartNumberValidation(validation);

    if (!validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        part_number: validation.message,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.part_number;
        return newErrors;
      });
    }
  };

  // Sugerir preço de venda
  const sugerirPrecoVenda = () => {
    const custo = parseFloat(formData.preco_custo);
    if (custo > 0) {
      const precoSugerido = calcularPrecoVenda(custo, DEFAULT_MARGIN_PERCENTAGE);
      setFormData((prev) => ({
        ...prev,
        preco_venda: precoSugerido.toFixed(2),
      }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_number.trim()) newErrors.part_number = 'Part Number é obrigatório';
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.categoria) newErrors.categoria = 'Categoria é obrigatória';
    if (!formData.preco_custo || parseFloat(formData.preco_custo) <= 0)
      newErrors.preco_custo = 'Preço de custo inválido';
    if (!formData.preco_venda || parseFloat(formData.preco_venda) <= 0)
      newErrors.preco_venda = 'Preço de venda inválido';

    // Check logic: selling price > cost price
    const custo = parseFloat(formData.preco_custo);
    const venda = parseFloat(formData.preco_venda);
    if (custo > 0 && venda > 0 && venda <= custo) {
      newErrors.preco_venda = 'Preço de venda deve ser maior que o custo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar peça:', error);
    }
  };

  const getMargemColor = (percentual: number) => {
    if (percentual >= HIGH_MARGIN_THRESHOLD) return 'text-green-600';
    if (percentual >= MEDIUM_MARGIN_THRESHOLD) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {peca ? 'Editar Peça' : 'Nova Peça'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="rounded-xl bg-gray-50/50 p-6 border border-gray-100">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Package className="mr-2 h-5 w-5 text-blue-600" />
            Informações Básicas
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="part_number">Part Number *</Label>
              <Input
                id="part_number"
                value={formData.part_number}
                onChange={e => handlePartNumberChange(e.target.value)}
                className={`mt-1.5 ${errors.part_number ? 'border-red-500' : ''}`}
                placeholder="Ex: APL-001-2024"
              />
              {partNumberValidation && (
                <div className={`mt-1 text-sm ${partNumberValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.part_number && partNumberValidation.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className={`mt-1.5 ${errors.nome ? 'border-red-500' : ''}`}
                placeholder="Nome da peça"
              />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={value => setFormData(prev => ({ ...prev, categoria: value as CategoriaPeca }))}
              >
                <SelectTrigger className={`mt-1.5 ${errors.categoria ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_PECA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="mt-1 text-sm text-red-600">{errors.categoria}</p>}
            </div>

            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select
                value={formData.fornecedor_id}
                onValueChange={value => setFormData(prev => ({ ...prev, fornecedor_id: value }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map(fornecedor => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className="mt-1.5"
              placeholder="Descrição detalhada da peça"
              rows={3}
            />
          </div>
        </div>

        {/* Preços */}
        <div className="rounded-xl bg-gray-50/50 p-6 border border-gray-100">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <DollarSign className="mr-2 h-5 w-5 text-green-600" />
            Preços
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="preco_custo">Preço de Custo (R$) *</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_custo}
                onChange={e => setFormData(prev => ({ ...prev, preco_custo: e.target.value }))}
                className={`mt-1.5 ${errors.preco_custo ? 'border-red-500' : ''}`}
                placeholder="0,00"
              />
              {errors.preco_custo && <p className="mt-1 text-sm text-red-600">{errors.preco_custo}</p>}
            </div>

            <div>
              <div className="flex justify-between">
                <Label htmlFor="preco_venda">Preço de Venda (R$) *</Label>
                <button
                  type="button"
                  onClick={sugerirPrecoVenda}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sugerir (+{DEFAULT_MARGIN_PERCENTAGE}%)
                </button>
              </div>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_venda}
                onChange={e => setFormData(prev => ({ ...prev, preco_venda: e.target.value }))}
                className={`mt-1.5 ${errors.preco_venda ? 'border-red-500' : ''}`}
                placeholder="0,00"
              />
              {errors.preco_venda && <p className="mt-1 text-sm text-red-600">{errors.preco_venda}</p>}
            </div>
          </div>

          {margem && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  Margem Estimada:
                </span>
                <span className={`text-sm font-bold ${getMargemColor(margem.percentual)}`}>
                  {margem.percentual.toFixed(1)}% ({formatarMoeda(margem.valor)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Estoque */}
        <div className="rounded-xl bg-gray-50/50 p-6 border border-gray-100">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Package className="mr-2 h-5 w-5 text-orange-600" />
            Controle de Estoque
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <Label htmlFor="estoque_atual">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                min="0"
                value={formData.estoque_atual}
                onChange={e => setFormData(prev => ({ ...prev, estoque_atual: e.target.value }))}
                className="mt-1.5"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                min="0"
                value={formData.estoque_minimo}
                onChange={e => setFormData(prev => ({ ...prev, estoque_minimo: e.target.value }))}
                className="mt-1.5"
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                value={formData.localizacao}
                onChange={e => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                className="mt-1.5"
                placeholder="Ex: A1"
              />
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="rounded-xl bg-gray-50/50 p-6 border border-gray-100">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <Settings className="mr-2 h-5 w-5 text-gray-600" />
            Informações Adicionais
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => setFormData(prev => ({ ...prev, status: value as StatusPeca }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_PECA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.001"
                min="0"
                value={formData.peso}
                onChange={e => setFormData(prev => ({ ...prev, peso: e.target.value }))}
                className="mt-1.5"
                placeholder="0,000"
              />
            </div>

            <div>
              <Label htmlFor="garantia">Garantia (meses)</Label>
              <Input
                id="garantia"
                type="number"
                min="0"
                value={formData.garantia_meses}
                onChange={e => setFormData(prev => ({ ...prev, garantia_meses: e.target.value }))}
                className="mt-1.5"
                placeholder="12"
              />
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="mt-1.5"
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {peca ? 'Atualizar' : 'Salvar'} Peça
          </Button>
        </div>
      </form>
    </div>
  );
}
