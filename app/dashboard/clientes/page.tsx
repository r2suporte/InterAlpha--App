'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { InputMask } from '@/components/ui/input-mask'
import { DocumentSelector } from '@/components/ui/document-selector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Trash2,
  Users,
  Loader2,
  Search,
  FileText,
  Building,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import {
  validarCpfCnpj,
  formatarCpfCnpj,
  formatarTelefone,
  formatarCEP,
  validarEmail,
  validarCEP,
  buscarEnderecoPorCEP,
  buscarDadosCNPJ,
  determinarTipoPessoa,
  getMascaraCpfCnpj,
  limparDocumento,
  validarCamposObrigatorios,
  type TipoPessoa,
  type EnderecoCompleto,
  type ViaCepResponse,
  type CNPJResponse
} from '@/lib/validators'

interface Cliente {
  id: string
  numero_cliente: string | null
  nome: string
  email: string
  telefone: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  cpf_cnpj: string | null
  tipo_pessoa: TipoPessoa
  observacoes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

interface FormData {
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  tipo_pessoa: TipoPessoa
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  observacoes: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)
  const [loadingCnpj, setLoadingCnpj] = useState(false)
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
    observacoes: ''
  })
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchClientes()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
    }
  }

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (err: any) {
      setErrors(['Erro ao carregar clientes: ' + err.message])
    } finally {
      setLoading(false)
    }
  }

  const buscarCEP = async (cep: string) => {
    if (!validarCEP(cep)) return

    setLoadingCep(true)
    try {
      const endereco = await buscarEnderecoPorCEP(cep)
      if (endereco) {
        setFormData(prev => ({
          ...prev,
          logradouro: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.localidade,
          estado: endereco.uf,
          complemento: endereco.complemento || prev.complemento
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setLoadingCep(false)
    }
  }

  const handleCepChange = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, cep: formatarCEP(cleanCep) }))
    
    if (cleanCep.length === 8) {
      buscarCEP(cleanCep)
    }
  }

  const buscarCNPJ = async (cnpj: string) => {
    setLoadingCnpj(true)
    try {
      const dadosCnpj = await buscarDadosCNPJ(cnpj)
      
      if (dadosCnpj && !dadosCnpj.erro && dadosCnpj.nome) {
        setFormData(prev => ({
          ...prev,
          nome: dadosCnpj.nome,
          // Preencher endereço se disponível
          ...(dadosCnpj.endereco && {
            cep: dadosCnpj.endereco.cep ? formatarCEP(dadosCnpj.endereco.cep) : prev.cep,
            logradouro: dadosCnpj.endereco.logradouro || prev.logradouro,
            numero: dadosCnpj.endereco.numero || prev.numero,
            complemento: dadosCnpj.endereco.complemento || prev.complemento,
            bairro: dadosCnpj.endereco.bairro || prev.bairro,
            cidade: dadosCnpj.endereco.municipio || prev.cidade,
            estado: dadosCnpj.endereco.uf || prev.estado
          }),
          // Preencher telefone se disponível
          telefone: dadosCnpj.telefone || prev.telefone
        }))
        
        setSuccess('Dados da empresa encontrados e preenchidos automaticamente!')
        setTimeout(() => setSuccess(''), 3000)
      } else if (dadosCnpj?.erro) {
        setErrors([dadosCnpj.message || 'CNPJ não encontrado'])
        setTimeout(() => setErrors([]), 3000)
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
      setErrors(['Erro ao consultar dados do CNPJ'])
      setTimeout(() => setErrors([]), 3000)
    } finally {
      setLoadingCnpj(false)
    }
  }

  const handleDocumentoChange = (documento: string, tipoPessoa: TipoPessoa) => {
    setFormData(prev => ({
      ...prev,
      cpf_cnpj: documento,
      tipo_pessoa: tipoPessoa
    }))

    // Se for CNPJ e estiver válido, buscar dados automaticamente
    if (tipoPessoa === 'juridica' && documento) {
      const cleanCnpj = documento.replace(/\D/g, '')
      if (cleanCnpj.length === 14 && validarCpfCnpj(documento, tipoPessoa)) {
        buscarCNPJ(cleanCnpj)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSuccess('')

    // Validar campos obrigatórios
    const validationErrors = validarCamposObrigatorios({
      nome: formData.nome,
      email: formData.email,
      cpfCnpj: formData.cpf_cnpj,
      tipoPessoa: formData.tipo_pessoa
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar o ID do usuário na nossa tabela
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('supabaseId', user.id)
        .single()

      if (!userData) throw new Error('Usuário não encontrado')

      const clienteData = {
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone || null,
        cpf_cnpj: limparDocumento(formData.cpf_cnpj),
        tipo_pessoa: formData.tipo_pessoa,
        cep: limparDocumento(formData.cep) || null,
        endereco: formData.logradouro ? 
          `${formData.logradouro}, ${formData.numero}${formData.complemento ? `, ${formData.complemento}` : ''}, ${formData.bairro}` : null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString()
      }

      if (editingCliente) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id)

        if (error) throw error
        setSuccess('Cliente atualizado com sucesso!')
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert({
            ...clienteData,
            created_by: userData.id
          })

        if (error) throw error
        setSuccess('Cliente criado com sucesso!')
      }

      resetForm()
      setShowModal(false)
      fetchClientes()
    } catch (err: any) {
      setErrors(['Erro ao salvar cliente: ' + err.message])
    }
  }

  const resetForm = () => {
    setFormData({
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
      observacoes: ''
    })
    setEditingCliente(null)
    setErrors([])
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    
    // Separar endereço em componentes se existir
    const enderecoPartes = cliente.endereco?.split(', ') || []
    
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
      observacoes: cliente.observacoes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSuccess('Cliente excluído com sucesso!')
      fetchClientes()
    } catch (err: any) {
      setErrors(['Erro ao excluir cliente: ' + err.message])
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(searchTerm.replace(/\D/g, '')))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar ao Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Clientes</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} {searchTerm ? 'encontrado' : 'cadastrado'}{filteredClientes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-6">
          
          {/* Mensagens de erro e sucesso */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-700">{error}</li>
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

          {/* Barra de Pesquisa */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por nome, email ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          {filteredClientes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <CardTitle className="text-xl text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </CardTitle>
                <CardDescription className="mb-6">
                  {searchTerm 
                    ? 'Tente ajustar os termos de pesquisa ou limpar o filtro.'
                    : 'Comece criando seu primeiro cliente para gerenciar seus contatos.'
                  }
                </CardDescription>
                {!searchTerm && (
                  <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClientes.map((cliente) => (
                <Card key={cliente.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {getInitials(cliente.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{cliente.nome}</CardTitle>
                          {cliente.numero_cliente && (
                            <p className="text-sm text-gray-500 font-mono">ID: {cliente.numero_cliente}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={cliente.tipo_pessoa === 'fisica' ? 'default' : 'secondary'}>
                              {cliente.tipo_pessoa === 'fisica' ? (
                                <><User className="h-3 w-3 mr-1" /> PF</>
                              ) : (
                                <><Building className="h-3 w-3 mr-1" /> PJ</>
                              )}
                            </Badge>
                            <Badge variant={cliente.is_active ? 'default' : 'destructive'}>
                              {cliente.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
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
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    
                    {cliente.cpf_cnpj && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatarCpfCnpj(cliente.cpf_cnpj, cliente.tipo_pessoa)}</span>
                      </div>
                    )}
                    
                    {cliente.telefone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{formatarTelefone(cliente.telefone)}</span>
                      </div>
                    )}
                    
                    {(cliente.endereco || cliente.cidade) && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {cliente.endereco && `${cliente.endereco}, `}
                          {cliente.cidade && cliente.estado && `${cliente.cidade}/${cliente.estado}`}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                      <Calendar className="h-3 w-3 mr-1" />
                      Criado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Criação/Edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente 
                ? 'Atualize as informações do cliente' 
                : 'Preencha os dados para criar um novo cliente'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>
              
              {/* ID do Cliente - somente leitura */}
              {editingCliente && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="id_cliente">ID do Cliente</Label>
                      <Input
                        id="id_cliente"
                        type="text"
                        value={editingCliente.numero_cliente || 'Gerando...'}
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_criacao">Data de Criação</Label>
                      <Input
                        id="data_criacao"
                        type="text"
                        value={new Date(editingCliente.created_at).toLocaleDateString('pt-BR')}
                        disabled
                        className="bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <div className="relative">
                    <Input
                      id="nome"
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder={loadingCnpj ? "Buscando dados da empresa..." : "Nome completo do cliente"}
                      disabled={loadingCnpj}
                    />
                    {loadingCnpj && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
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
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, telefone: e.target.value })}
                     id="telefone"
                     placeholder="(11) 99999-9999"
                   />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <InputMask
                      mask="99999-999"
                      value={formData.cep}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCepChange(e.target.value)}
                      id="cep"
                      placeholder="00000-000"
                    />
                    {loadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Apto, Sala, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Nome do bairro"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
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
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Observações</h3>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
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
    </div>
  )
}