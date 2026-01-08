'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

import { EnhancedSidebar } from '@/components/navigation/enhanced-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContactInfo, DataField, DataGrid } from '@/components/ui/data-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentSelector } from '@/components/ui/document-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { InputMask } from '@/components/ui/input-mask';
import { Label } from '@/components/ui/label';
import {
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveText,
  ShowHide,
  useBreakpoint,
} from '@/components/ui/responsive-utils';
import { SearchAndFilter } from '@/components/ui/search-and-filter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarProvider } from '@/components/ui/sidebar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import {
  type CNPJResponse,
  type EnderecoCompleto,
  type TipoPessoa,
  type ViaCepResponse,
  determinarTipoPessoa,
  formatarCEP,
  formatarCpfCnpj,
  formatarTelefone,
  getMascaraCpfCnpj,
  limparDocumento,
  validarCEP,
  validarCamposObrigatorios,
  validarCpfCnpj,
  validarEmail,
} from '@/lib/validators';

interface Cliente {
  id: string;
  numero_cliente: string | null;
  nome: string;
  email: string;
  email2?: string | null;
  email3?: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  cpf_cnpj: string | null;
  tipo_pessoa: TipoPessoa;
  observacoes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface FormData {
  nome: string;
  email: string;
  email2?: string;
  email3?: string;
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  const { isMobile } = useBreakpoint();
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    email2: '',
    email3: '',
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
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (err: any) {
      setErrors([`Erro ao carregar clientes: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const buscarCEP = async (cep: string) => {
    if (!validarCEP(cep)) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`/api/cep/${cep}`);

      if (!response.ok) {
        throw new Error('CEP não encontrado');
      }

      const endereco: ViaCepResponse = await response.json();

      if (endereco) {
        setFormData(prev => ({
          ...prev,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.localidade,
          estado: endereco.uf,
          complemento: endereco.complemento || prev.complemento,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setErrors(['Erro ao buscar CEP. Verifique o CEP e tente novamente.']);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, cep: formatarCEP(cleanCep) }));

    if (cleanCep.length === 8) {
      buscarCEP(cleanCep);
    }
  };

  const buscarCNPJ = async (cnpj: string) => {
    setLoadingCnpj(true);
    try {
      const response = await fetch(`/api/cnpj/${cnpj}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'CNPJ não encontrado');
      }

      const dadosCnpj: CNPJResponse = await response.json();

      if (dadosCnpj && !dadosCnpj.erro && dadosCnpj.nome) {
        setFormData(prev => ({
          ...prev,
          nome: dadosCnpj.nome,
          // Preencher endereço se disponível
          ...(dadosCnpj.endereco && {
            cep: dadosCnpj.endereco.cep
              ? formatarCEP(dadosCnpj.endereco.cep)
              : prev.cep,
            logradouro: dadosCnpj.endereco.logradouro || prev.logradouro,
            numero: dadosCnpj.endereco.numero || prev.numero,
            complemento: dadosCnpj.endereco.complemento || prev.complemento,
            bairro: dadosCnpj.endereco.bairro || prev.bairro,
            cidade: dadosCnpj.endereco.municipio || prev.cidade,
            estado: dadosCnpj.endereco.uf || prev.estado,
          }),
          // Preencher telefone se disponível
          telefone: dadosCnpj.telefone || prev.telefone,
        }));

        setSuccess(
          'Dados da empresa encontrados e preenchidos automaticamente!'
        );
        setTimeout(() => setSuccess(''), 3000);
      } else if (dadosCnpj?.erro) {
        setErrors([dadosCnpj.message || 'CNPJ não encontrado']);
        setTimeout(() => setErrors([]), 3000);
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao consultar dados do CNPJ']);
      setTimeout(() => setErrors([]), 3000);
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleDocumentoChange = (documento: string, tipoPessoa: TipoPessoa) => {
    setFormData(prev => ({
      ...prev,
      cpf_cnpj: documento,
      tipo_pessoa: tipoPessoa,
    }));

    // Se for CNPJ e estiver válido, buscar dados automaticamente
    if (tipoPessoa === 'juridica' && documento) {
      const cleanCnpj = documento.replace(/\D/g, '');
      if (cleanCnpj.length === 14 && validarCpfCnpj(documento, tipoPessoa)) {
        buscarCNPJ(cleanCnpj);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');

    // Validar campos obrigatórios
    const validationErrors = validarCamposObrigatorios({
      nome: formData.nome,
      email: formData.email,
      cpfCnpj: formData.cpf_cnpj,
      tipoPessoa: formData.tipo_pessoa,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o ID do usuário na nossa tabela
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('supabaseId', user.id)
        .single();

      if (!userData) throw new Error('Usuário não encontrado');

      // Validação de e-mails adicionais, se preenchidos
      const optionalEmails = [formData.email2, formData.email3].filter(
        Boolean
      ) as string[];
      if (optionalEmails.some(e => !validarEmail(e))) {
        setErrors(['Email(s) adicional(is) inválido(s). Verifique Email 2/3.']);
        return;
      }

      const clienteData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        email2: formData.email2 ? formData.email2.trim().toLowerCase() : null,
        email3: formData.email3 ? formData.email3.trim().toLowerCase() : null,
        telefone: formData.telefone || null,
        cpf_cnpj: limparDocumento(formData.cpf_cnpj),
        tipo_pessoa: formData.tipo_pessoa,
        cep: limparDocumento(formData.cep) || null,
        endereco: formData.logradouro
          ? `${formData.logradouro}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''}, ${formData.bairro}`
          : null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString(),
      };

      if (editingCliente) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id);

        if (error) throw error;
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const { data: novoCliente, error } = await supabase
          .from('clientes')
          .insert({
            ...clienteData,
            created_by: userData.id,
          })
          .select('id, numero_cliente, nome')
          .single();

        if (error) throw error;

        if (novoCliente?.numero_cliente) {
          setSuccess(
            `Cliente criado com sucesso! ID: ${novoCliente.numero_cliente}`
          );
        } else {
          setSuccess('Cliente criado com sucesso!');
        }
      }

      resetForm();
      setShowModal(false);
      fetchClientes();
    } catch (err: any) {
      setErrors([`Erro ao salvar cliente: ${err.message}`]);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      email2: '',
      email3: '',
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
    });
    setEditingCliente(null);
    setErrors([]);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);

    // Separar endereço em componentes se existir
    const enderecoPartes = cliente.endereco?.split(', ') || [];

    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone || '',
      cpf_cnpj: formatarCpfCnpj(cliente.cpf_cnpj || '', cliente.tipo_pessoa),
      tipo_pessoa: cliente.tipo_pessoa,
      cep: formatarCEP(cliente.cep || ''),
      logradouro: enderecoPartes[0] || '',
      numero: enderecoPartes[1] || '',
      complemento: enderecoPartes[2] || '',
      bairro: enderecoPartes[3] || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      observacoes: cliente.observacoes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);

      if (error) throw error;
      setSuccess('Cliente excluído com sucesso!');
      fetchClientes();
    } catch (err: any) {
      setErrors([`Erro ao excluir cliente: ${err.message}`]);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredClientes = clientes.filter(cliente => {
    // Filtro por texto de pesquisa
    const matchesSearch =
      !searchTerm ||
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.cpf_cnpj &&
        cliente.cpf_cnpj.includes(searchTerm.replace(/\D/g, '')));

    // Filtros avançados
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;

      switch (key) {
        case 'tipo_pessoa':
          return cliente.tipo_pessoa === value;
        case 'status':
          return value === 'active' ? cliente.is_active : !cliente.is_active;
        case 'cidade':
          return cliente.cidade?.toLowerCase().includes(value.toLowerCase());
        case 'estado':
          return cliente.estado?.toLowerCase().includes(value.toLowerCase());
        default:
          return true;
      }
    });

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <EnhancedSidebar />
      <div className="flex w-full flex-1 flex-col bg-background">
        <SiteHeader />
        <ResponsiveContainer className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          {/* Header Section */}
          <div className="mb-6 flex items-center gap-4">
            <BackButton href="/dashboard" />
            <div>
              <ResponsiveText
                size={isMobile ? '2xl' : '3xl'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold tracking-tight text-transparent"
              >
                Gerenciar Clientes
              </ResponsiveText>
            </div>
          </div>
          <ResponsiveStack
            direction="responsive"
            align="center"
            className="space-y-4 sm:space-y-0"
          >
            <div>
              <ResponsiveText
                size={isMobile ? 'sm' : 'base'}
                className="text-muted-foreground"
              >
                {filteredClientes.length} cliente
                {filteredClientes.length !== 1 ? 's' : ''}{' '}
                {searchTerm ? 'encontrado' : 'cadastrado'}
                {filteredClientes.length !== 1 ? 's' : ''}
              </ResponsiveText>
            </div>

            <ShowHide hide={['sm']}>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.preventDefault();
                  console.log('🔵 Clique em Filtros');
                  // Aqui você pode adicionar lógica de filtros
                }}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>

              </div>
            </ShowHide>

            <ShowHide on={['sm']}>
              <div className="flex w-full items-center space-x-2">

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.preventDefault();
                      console.log('🔵 Clique em Filtros (Mobile)');
                    }}>
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ShowHide>
          </ResponsiveStack>

          <div className="space-y-6">
            {/* Mensagens de erro e sucesso */}
            {errors.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-inside list-disc">
                    {errors.map((error, index) => (
                      <li key={index} className="text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Barra de Pesquisa e Filtros */}
            <SearchAndFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Pesquisar por nome, email ou CPF/CNPJ..."
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={[
                {
                  key: 'tipo_pessoa',
                  label: 'Tipo de Pessoa',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'fisica', label: 'Pessoa Física' },
                    { value: 'juridica', label: 'Pessoa Jurídica' },
                  ],
                },
                {
                  key: 'status',
                  label: 'Status',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ],
                },
                {
                  key: 'estado',
                  label: 'Estado',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'SP', label: 'São Paulo' },
                    { value: 'RJ', label: 'Rio de Janeiro' },
                    { value: 'MG', label: 'Minas Gerais' },
                    { value: 'RS', label: 'Rio Grande do Sul' },
                    { value: 'PR', label: 'Paraná' },
                    { value: 'SC', label: 'Santa Catarina' },
                  ],
                },
              ]}
            />

            {/* Lista de Clientes */}
            {filteredClientes.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent className="pt-6">
                  <Users className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <CardTitle className="mb-2 text-xl text-gray-900">
                    {searchTerm
                      ? 'Nenhum cliente encontrado'
                      : 'Nenhum cliente cadastrado'}
                  </CardTitle>
                  <CardDescription className="mb-6">
                    {searchTerm
                      ? 'Tente ajustar os termos de pesquisa ou limpar o filtro.'
                      : 'Comece criando seu primeiro cliente para gerenciar seus contatos.'}
                  </CardDescription>
                  {!searchTerm && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('🔵 Clique em Criar Primeiro Cliente');
                        openCreateModal();
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Cliente
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClientes.map(cliente => (
                  <Card
                    key={cliente.id}
                    className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg sm:hover:scale-105"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                          <Avatar className="h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12">
                            <AvatarFallback className="bg-blue-100 text-sm font-semibold text-blue-600 sm:text-base">
                              {getInitials(cliente.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base sm:text-lg">
                              {cliente.nome}
                            </CardTitle>
                            {cliente.numero_cliente && (
                              <p className="font-mono text-xs text-gray-500 sm:text-sm">
                                ID: {cliente.numero_cliente}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                              <StatusBadge
                                status={
                                  cliente.tipo_pessoa === 'fisica'
                                    ? 'info'
                                    : 'warning'
                                }
                                text={
                                  cliente.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'
                                }
                                size="sm"
                                showIcon={false}
                              />
                              <StatusBadge
                                status={
                                  cliente.is_active ? 'active' : 'inactive'
                                }
                                text={cliente.is_active ? 'Ativo' : 'Inativo'}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cliente.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <DataField
                        label="Email"
                        value={cliente.email}
                        icon="mail"
                        copyable
                        className="text-sm"
                      />

                      {cliente.cpf_cnpj && (
                        <DataField
                          label={
                            cliente.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'
                          }
                          value={formatarCpfCnpj(
                            cliente.cpf_cnpj,
                            cliente.tipo_pessoa
                          )}
                          icon="fileText"
                          copyable
                          className="text-sm"
                        />
                      )}

                      {cliente.telefone && (
                        <DataField
                          label="Telefone"
                          value={formatarTelefone(cliente.telefone)}
                          icon="phone"
                          copyable
                          className="text-sm"
                        />
                      )}

                      {(cliente.endereco || cliente.cidade) && (
                        <DataField
                          label="Localização"
                          value={`${cliente.endereco ? `${cliente.endereco}, ` : ''}${cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : ''}`}
                          icon="mapPin"
                          className="text-sm"
                        />
                      )}

                      <div className="flex items-center border-t pt-2 text-xs text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        Criado em{' '}
                        {new Date(cliente.created_at).toLocaleDateString(
                          'pt-BR'
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ResponsiveContainer>
      </div>

      {/* Modal de Criação/Edição de Cliente */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente
                ? 'Atualize as informações do cliente'
                : 'Preencha os dados para criar um novo cliente'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Dados Pessoais
              </h3>

              {/* ID do Cliente - somente leitura */}
              {editingCliente && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <DataGrid columns={2}>
                    <div className="space-y-2">
                      <Label htmlFor="id_cliente">ID do Cliente</Label>
                      <Input
                        id="id_cliente"
                        type="text"
                        value={
                          editingCliente?.numero_cliente ||
                          'ID será gerado automaticamente'
                        }
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                      {editingCliente?.numero_cliente && (
                        <p className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          ID gerado automaticamente pelo sistema
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_criacao">Data de Criação</Label>
                      <Input
                        id="data_criacao"
                        type="text"
                        value={new Date(
                          editingCliente?.created_at || ''
                        ).toLocaleDateString('pt-BR')}
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                    </div>
                  </DataGrid>
                </div>
              )}

              <DataGrid columns={2}>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <div className="relative">
                    <Input
                      id="nome"
                      type="text"
                      required
                      value={formData.nome}
                      onChange={e =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder={
                        loadingCnpj
                          ? 'Buscando dados da empresa...'
                          : 'Nome completo do cliente'
                      }
                      disabled={loadingCnpj}
                    />
                    {loadingCnpj && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email2">Email 2</Label>
                      <Input
                        id="email2"
                        type="email"
                        value={formData.email2}
                        onChange={e =>
                          setFormData({ ...formData, email2: e.target.value })
                        }
                        placeholder="email2@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email3">Email 3</Label>
                      <Input
                        id="email3"
                        type="email"
                        value={formData.email3}
                        onChange={e =>
                          setFormData({ ...formData, email3: e.target.value })
                        }
                        placeholder="email3@exemplo.com"
                      />
                    </div>
                  </div>
                </div>
              </DataGrid>

              <DataGrid columns={2}>
                <div className="space-y-2">
                  <DocumentSelector
                    value={formData.cpf_cnpj}
                    onChange={handleDocumentoChange}
                    id="cpf_cnpj"
                    placeholder="Selecione o tipo de documento"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <InputMask
                    mask="(99) 99999-9999"
                    value={formData.telefone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    id="telefone"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </DataGrid>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <InputMask
                      mask="99999-999"
                      value={formData.cep}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCepChange(e.target.value)
                      }
                      id="cep"
                      placeholder="00000-000"
                    />
                    {loadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={e =>
                      setFormData({ ...formData, logradouro: e.target.value })
                    }
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
              </div>

              <DataGrid columns={4}>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={e =>
                      setFormData({ ...formData, numero: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={e =>
                      setFormData({ ...formData, complemento: e.target.value })
                    }
                    placeholder="Apto, Sala, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={e =>
                      setFormData({ ...formData, bairro: e.target.value })
                    }
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={e =>
                      setFormData({ ...formData, cidade: e.target.value })
                    }
                    placeholder="Nome da cidade"
                  />
                </div>
              </DataGrid>

              <DataGrid columns={1}>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={value =>
                      setFormData({ ...formData, estado: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="AL">AL</SelectItem>
                      <SelectItem value="AP">AP</SelectItem>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="BA">BA</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="DF">DF</SelectItem>
                      <SelectItem value="ES">ES</SelectItem>
                      <SelectItem value="GO">GO</SelectItem>
                      <SelectItem value="MA">MA</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="MS">MS</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                      <SelectItem value="PA">PA</SelectItem>
                      <SelectItem value="PB">PB</SelectItem>
                      <SelectItem value="PR">PR</SelectItem>
                      <SelectItem value="PE">PE</SelectItem>
                      <SelectItem value="PI">PI</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="RN">RN</SelectItem>
                      <SelectItem value="RS">RS</SelectItem>
                      <SelectItem value="RO">RO</SelectItem>
                      <SelectItem value="RR">RR</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="SE">SE</SelectItem>
                      <SelectItem value="TO">TO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DataGrid>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Observações
              </h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={e =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  rows={3}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingCliente ? 'Atualizar' : 'Criar'} Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
