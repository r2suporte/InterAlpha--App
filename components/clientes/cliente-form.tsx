'use client';

import { useState } from 'react';

import { AlertCircle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DocumentSelector } from '@/components/ui/document-selector';
import { Input } from '@/components/ui/input';
import { InputMask } from '@/components/ui/input-mask';
import { Label } from '@/components/ui/label';
import {
  CollapsibleSection,
  ResponsiveGrid,
  ResponsiveStack,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type CNPJResponse,
  type EnderecoCompleto,
  type TipoPessoa,
  type ViaCepResponse,
  buscarDadosCNPJ,
  buscarEnderecoPorCEP,
  determinarTipoPessoa,
  formatarCEP,
  formatarCpfCnpj,
  getMascaraCpfCnpj,
  limparDocumento,
  validarCEP,
  validarCamposObrigatorios,
  validarCpfCnpj,
  validarEmail,
} from '@/lib/validators';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  tipo_pessoa: TipoPessoa;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
}

interface ClienteFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title: string;
}

export function ClienteForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  title,
}: ClienteFormProps) {
  const { isMobile } = useBreakpoint();

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    tipo_pessoa: 'fisica',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCepChange = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    handleInputChange('cep', formatarCEP(cep));

    if (cepLimpo.length === 8 && validarCEP(cepLimpo)) {
      setIsLoadingCep(true);
      try {
        const endereco = await buscarEnderecoPorCEP(cepLimpo);
        if (endereco) {
          setFormData(prev => ({
            ...prev,
            logradouro: endereco.logradouro || '',
            bairro: endereco.bairro || '',
            cidade: endereco.localidade || '',
            estado: endereco.uf || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleDocumentChange = async (documento: string) => {
    const docLimpo = limparDocumento(documento);
    const tipoPessoa = determinarTipoPessoa(docLimpo);

    setFormData(prev => ({
      ...prev,
      cpf_cnpj: formatarCpfCnpj(documento, tipoPessoa),
      tipo_pessoa: tipoPessoa,
    }));

    if (
      tipoPessoa === 'juridica' &&
      docLimpo.length === 14 &&
      validarCpfCnpj(docLimpo, tipoPessoa)
    ) {
      setIsLoadingCnpj(true);
      try {
        const dadosCnpj = await buscarDadosCNPJ(docLimpo);
        if (dadosCnpj && dadosCnpj.endereco) {
          setFormData(prev => ({
            ...prev,
            nome: dadosCnpj.nome || prev.nome,
            email: dadosCnpj.email || prev.email,
            telefone: dadosCnpj.telefone || prev.telefone,
            cep: dadosCnpj.endereco?.cep
              ? formatarCEP(dadosCnpj.endereco.cep)
              : prev.cep,
            logradouro: dadosCnpj.endereco?.logradouro || prev.logradouro,
            numero: dadosCnpj.endereco?.numero || prev.numero,
            complemento: dadosCnpj.endereco?.complemento || prev.complemento,
            bairro: dadosCnpj.endereco?.bairro || prev.bairro,
            cidade: dadosCnpj.endereco?.municipio || prev.cidade,
            estado: dadosCnpj.endereco?.uf || prev.estado,
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
      } finally {
        setIsLoadingCnpj(false);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (
      formData.cpf_cnpj &&
      !validarCpfCnpj(limparDocumento(formData.cpf_cnpj), formData.tipo_pessoa)
    ) {
      newErrors.cpf_cnpj = 'CPF/CNPJ inválido';
    }

    if (formData.cep && !validarCEP(formData.cep.replace(/\D/g, ''))) {
      newErrors.cep = 'CEP inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Preencha as informações do cliente
        </p>
      </div>

      {/* Informações Básicas */}
      <CollapsibleSection title="Informações Básicas" defaultOpen>
        <ResponsiveGrid cols={{ sm: 1, md: 2 }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={e => handleInputChange('nome', e.target.value)}
              placeholder="Nome completo"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <InputMask
              id="telefone"
              mask="(99) 99999-9999"
              value={formData.telefone}
              onChange={e => handleInputChange('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
            <div className="relative">
              <DocumentSelector
                value={formData.cpf_cnpj}
                onChange={handleDocumentChange}
                placeholder="000.000.000-00"
                className={errors.cpf_cnpj ? 'border-red-500' : ''}
              />
              {isLoadingCnpj && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            {errors.cpf_cnpj && (
              <p className="text-sm text-red-500">{errors.cpf_cnpj}</p>
            )}
          </div>
        </ResponsiveGrid>
      </CollapsibleSection>

      {/* Endereço */}
      <CollapsibleSection title="Endereço" defaultOpen={!isMobile}>
        <div className="space-y-4">
          <ResponsiveGrid cols={{ sm: 1, md: 2 }}>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="relative">
                <InputMask
                  id="cep"
                  mask="99999-999"
                  value={formData.cep}
                  onChange={e => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className={errors.cep ? 'border-red-500' : ''}
                />
                {isLoadingCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              {errors.cep && (
                <p className="text-sm text-red-500">{errors.cep}</p>
              )}
            </div>
          </ResponsiveGrid>

          <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={e => handleInputChange('logradouro', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={e => handleInputChange('numero', e.target.value)}
                placeholder="123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={e => handleInputChange('complemento', e.target.value)}
                placeholder="Apto, Sala, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={e => handleInputChange('bairro', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={e => handleInputChange('cidade', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={e => handleInputChange('estado', e.target.value)}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </ResponsiveGrid>
        </div>
      </CollapsibleSection>

      {/* Observações */}
      <CollapsibleSection title="Observações" defaultOpen={false}>
        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={e => handleInputChange('observacoes', e.target.value)}
            placeholder="Informações adicionais sobre o cliente..."
            rows={4}
          />
        </div>
      </CollapsibleSection>

      {/* Ações */}
      <ResponsiveStack direction="responsive" className="justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Cliente
        </Button>
      </ResponsiveStack>
    </form>
  );
}
