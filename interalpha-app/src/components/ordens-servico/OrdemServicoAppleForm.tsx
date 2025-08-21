'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  User, 
  Wrench, 
  Package, 
  DollarSign, 
  Shield, 
  FileText,
  Plus,
  Edit,
  Trash2,
  Apple,
  AlertTriangle
} from 'lucide-react'
import { OrdemServicoApple, ClienteInfo, DispositivoApple, ProblemaRelatado, AcaoReparo, PecaSubstituida, MaoDeObra, GarantiaServico, ObservacoesEspeciais } from '@/types/ordem-servico-apple'
import { PecasEAcoesDialog } from './PecasEAcoesDialog'
import { ObservacoesAppleDialog } from './ObservacoesAppleDialog'
import { ImpressaoOS } from './ImpressaoOS'

interface OrdemServicoAppleFormProps {
  ordem?: OrdemServicoApple
  onSave: (ordem: OrdemServicoApple) => void
  onCancel: () => void
}

export function OrdemServicoAppleForm({ ordem, onSave, onCancel }: OrdemServicoAppleFormProps) {
  const [formData, setFormData] = useState<Partial<OrdemServicoApple>>(ordem || {
    numero: ordem?.numero || 'Será gerado automaticamente',
    status: 'Recebido',
    prioridade: 'Normal',
    dataRecebimento: new Date(),
    cliente: {
      nome: '',
      endereco: '',
      telefone: '',
      email: ''
    },
    dispositivo: {
      modelo: '',
      numeroSerie: '',
      capacidade: '',
      cor: '',
      estadoFisico: 'Bom',
      acessorios: []
    },
    problema: {
      descricao: '',
      sintomas: [],
      frequencia: 'Às vezes',
      condicoes: ''
    },
    acoes: [],
    pecasSubstituidas: [],
    maoDeObra: {
      categoria: 'Básica',
      tempoEstimado: 60,
      tempoReal: 0,
      valorHora: 80,
      tecnico: '',
      complexidade: 1
    },
    garantia: {
      tipo: 'Fora de Garantia',
      periodo: 90,
      condicoes: [],
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      coberturas: [],
      exclusoes: []
    },
    observacoes: {
      backupNecessario: false,
      dadosImportantes: [],
      restricoes: [],
      recomendacoes: [],
      observacoesGerais: ''
    },
    valorPecas: 0,
    valorMaoDeObra: 0,
    valorTotal: 0
  })

  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  // Componente para Seleção/Informações do Cliente
  const ClienteDialog = () => {
    const [clientes, setClientes] = useState<any[]>([])
    const [searchCliente, setSearchCliente] = useState('')
    const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
    const [isLoadingClientes, setIsLoadingClientes] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

    const buscarClientes = async (search: string) => {
      setIsLoadingClientes(true)
      try {
        const response = await fetch(`/api/clientes?search=${encodeURIComponent(search)}&limit=10`)
        const result = await response.json()
        if (result.success) {
          setClientes(result.data)
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setIsLoadingClientes(false)
      }
    }

    const selecionarCliente = (cliente: any) => {
      setClienteSelecionado(cliente)
      setFormData(prev => ({
        ...prev,
        clienteId: cliente.id,
        cliente: {
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone || '',
          endereco: `${cliente.endereco || ''}, ${cliente.cidade || ''} - ${cliente.estado || ''}`
        }
      }))
    }

    return (
      <Dialog open={activeDialog === 'cliente'} onOpenChange={(open) => setActiveDialog(open ? 'cliente' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            {formData.cliente?.nome ? `Cliente: ${formData.cliente.nome}` : 'Selecionar Cliente'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Busca de Cliente */}
            <div>
              <label className="block text-sm font-medium mb-1">Buscar Cliente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md"
                  value={searchCliente}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchCliente(value)
                    
                    // Limpar timeout anterior
                    if (searchTimeout) {
                      clearTimeout(searchTimeout)
                    }
                    
                    // Buscar automaticamente após 500ms de pausa na digitação
                    if (value.length >= 2) {
                      const newTimeout = setTimeout(() => {
                        buscarClientes(value)
                      }, 500)
                      setSearchTimeout(newTimeout)
                    } else {
                      setClientes([])
                    }
                  }}
                  placeholder="Digite ID (#000001), nome, email, CPF ou CNPJ"
                />
                <Button 
                  type="button" 
                  onClick={() => buscarClientes(searchCliente)}
                  disabled={isLoadingClientes}
                >
                  {isLoadingClientes ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Exemplos: #000001, João Silva, joao@email.com, 123.456.789-00
              </p>
            </div>

            {/* Lista de Clientes */}
            {searchCliente.length >= 2 && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {isLoadingClientes ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Buscando clientes...</p>
                  </div>
                ) : clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        clienteSelecionado?.id === cliente.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => selecionarCliente(cliente)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-gray-600">{cliente.email}</p>
                          <p className="text-sm text-gray-500">
                            ID: #{cliente.numeroSequencial.toString().padStart(6, '0')} | 
                            {cliente.tipoDocumento}: {cliente.documento}
                          </p>
                          {cliente.telefone && (
                            <p className="text-sm text-gray-500">Tel: {cliente.telefone}</p>
                          )}
                          {cliente.cidade && cliente.estado && (
                            <p className="text-sm text-gray-500">{cliente.cidade} - {cliente.estado}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {cliente._count.ordensServico} O.S.
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">Nenhum cliente encontrado</p>
                    <p className="text-xs mt-1">Tente buscar por ID, nome, email ou documento</p>
                  </div>
                )}
              </div>
            )}

            {/* Cliente Selecionado */}
            {clienteSelecionado && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Cliente Selecionado</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <p className="font-medium">{clienteSelecionado.nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p>{clienteSelecionado.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Telefone:</span>
                    <p>{clienteSelecionado.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Documento:</span>
                    <p>{clienteSelecionado.tipoDocumento}: {clienteSelecionado.documento}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancelar</Button>
            <Button 
              onClick={() => setActiveDialog(null)}
              disabled={!clienteSelecionado}
            >
              Confirmar Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Componente para Dados do Dispositivo
  const DispositivoDialog = () => (
    <Dialog open={activeDialog === 'dispositivo'} onOpenChange={(open) => setActiveDialog(open ? 'dispositivo' : null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Smartphone className="h-4 w-4 mr-2" />
          Dados do Dispositivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Dados do Dispositivo Apple
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Modelo</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.modelo || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, modelo: e.target.value }
              }))}
            >
              <option value="">Selecione o modelo</option>
              <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
              <option value="iPhone 15 Pro">iPhone 15 Pro</option>
              <option value="iPhone 15 Plus">iPhone 15 Plus</option>
              <option value="iPhone 15">iPhone 15</option>
              <option value="iPhone 14 Pro Max">iPhone 14 Pro Max</option>
              <option value="iPhone 14 Pro">iPhone 14 Pro</option>
              <option value="iPhone 14 Plus">iPhone 14 Plus</option>
              <option value="iPhone 14">iPhone 14</option>
              <option value="iPhone 13 Pro Max">iPhone 13 Pro Max</option>
              <option value="iPhone 13 Pro">iPhone 13 Pro</option>
              <option value="iPhone 13">iPhone 13</option>
              <option value="iPhone 12 Pro Max">iPhone 12 Pro Max</option>
              <option value="iPhone 12 Pro">iPhone 12 Pro</option>
              <option value="iPhone 12">iPhone 12</option>
              <option value="iPad Pro 12.9">iPad Pro 12.9"</option>
              <option value="iPad Pro 11">iPad Pro 11"</option>
              <option value="iPad Air">iPad Air</option>
              <option value="iPad">iPad</option>
              <option value="MacBook Pro">MacBook Pro</option>
              <option value="MacBook Air">MacBook Air</option>
              <option value="iMac">iMac</option>
              <option value="Apple Watch">Apple Watch</option>
              <option value="AirPods Pro">AirPods Pro</option>
              <option value="AirPods">AirPods</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número de Série</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.numeroSerie || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, numeroSerie: e.target.value }
              }))}
              placeholder="Ex: F2LW8J9N0123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacidade</label>
            <select
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.capacidade || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, capacidade: e.target.value }
              }))}
            >
              <option value="">Selecione a capacidade</option>
              <option value="64GB">64GB</option>
              <option value="128GB">128GB</option>
              <option value="256GB">256GB</option>
              <option value="512GB">512GB</option>
              <option value="1TB">1TB</option>
              <option value="2TB">2TB</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cor</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.cor || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, cor: e.target.value }
              }))}
              placeholder="Ex: Azul Sierra, Preto Espacial"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IMEI (se aplicável)</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.imei || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, imei: e.target.value }
              }))}
              placeholder="Ex: 123456789012345"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Versão do iOS</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={formData.dispositivo?.versaoiOS || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                dispositivo: { ...prev.dispositivo!, versaoiOS: e.target.value }
              }))}
              placeholder="Ex: 17.2.1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Estado Físico</label>
            <div className="flex gap-2">
              {['Excelente', 'Bom', 'Regular', 'Ruim'].map((estado) => (
                <button
                  key={estado}
                  type="button"
                  className={`px-3 py-1 rounded-md text-sm ${
                    formData.dispositivo?.estadoFisico === estado
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dispositivo: { ...prev.dispositivo!, estadoFisico: estado as any }
                  }))}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Acessórios Inclusos</label>
            <div className="grid grid-cols-2 gap-2">
              {['Carregador', 'Cabo USB', 'Fones de Ouvido', 'Capa', 'Película', 'Caixa Original', 'Manual', 'Outros'].map((acessorio) => (
                <label key={acessorio} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.dispositivo?.acessorios?.includes(acessorio) || false}
                    onChange={(e) => {
                      const acessorios = formData.dispositivo?.acessorios || []
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          dispositivo: { ...prev.dispositivo!, acessorios: [...acessorios, acessorio] }
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          dispositivo: { ...prev.dispositivo!, acessorios: acessorios.filter(a => a !== acessorio) }
                        }))
                      }
                    }}
                  />
                  <span className="text-sm">{acessorio}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancelar</Button>
          <Button onClick={() => setActiveDialog(null)}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Componente para Garantia
  const GarantiaDialog = () => (
    <Dialog open={activeDialog === 'garantia'} onOpenChange={(open) => setActiveDialog(open ? 'garantia' : null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Shield className="h-4 w-4 mr-2" />
          Informações da Garantia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Informações da Garantia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Garantia</label>
            <div className="grid grid-cols-3 gap-2">
              {['Garantia Apple', 'Garantia InterAlpha', 'Fora de Garantia'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={`p-3 rounded-lg border text-sm font-medium ${
                    formData.garantia?.tipo === tipo
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    garantia: { ...prev.garantia!, tipo: tipo as any }
                  }))}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Campos específicos para Garantia Apple */}
          {formData.garantia?.tipo === 'Garantia Apple' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Informações da Garantia Apple</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Compra do Dispositivo</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.dataCompraDispositivo?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: { ...prev.garantia!, dataCompraDispositivo: new Date(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status da Garantia Apple</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.statusGarantiaApple || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: { ...prev.garantia!, statusGarantiaApple: e.target.value as any }
                    }))}
                  >
                    <option value="">Selecione o status</option>
                    <option value="Ativa">Ativa</option>
                    <option value="Expirada">Expirada</option>
                    <option value="Não verificada">Não verificada</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos para Garantia InterAlpha */}
          {formData.garantia?.tipo === 'Garantia InterAlpha' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">Informações da Garantia InterAlpha</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Número da O.S. Anterior</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.servicoInterAlpha?.numeroOS || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: {
                        ...prev.garantia!,
                        servicoInterAlpha: {
                          ...prev.garantia?.servicoInterAlpha!,
                          numeroOS: e.target.value
                        }
                      }
                    }))}
                    placeholder="Ex: OS-2024001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data do Serviço Anterior</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.servicoInterAlpha?.dataServico?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: {
                        ...prev.garantia!,
                        servicoInterAlpha: {
                          ...prev.garantia?.servicoInterAlpha!,
                          dataServico: new Date(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Serviço Anterior</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.servicoInterAlpha?.tipoServico || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: {
                        ...prev.garantia!,
                        servicoInterAlpha: {
                          ...prev.garantia?.servicoInterAlpha!,
                          tipoServico: e.target.value
                        }
                      }
                    }))}
                    placeholder="Ex: Troca de tela"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Técnico Responsável</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={formData.garantia?.servicoInterAlpha?.tecnicoResponsavel || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      garantia: {
                        ...prev.garantia!,
                        servicoInterAlpha: {
                          ...prev.garantia?.servicoInterAlpha!,
                          tecnicoResponsavel: e.target.value
                        }
                      }
                    }))}
                    placeholder="Nome do técnico"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Período de Garantia (dias)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                value={formData.garantia?.periodo || 90}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  garantia: { ...prev.garantia!, periodo: parseInt(e.target.value) }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de Início</label>
              <input
                type="date"
                className="w-full p-2 border rounded-md"
                value={formData.garantia?.dataInicio?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  garantia: { ...prev.garantia!, dataInicio: new Date(e.target.value) }
                }))}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setActiveDialog(null)}>Cancelar</Button>
          <Button onClick={() => setActiveDialog(null)}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {ordem ? 'Editar' : 'Nova'} Ordem de Serviço
          </h1>
          <p className="text-gray-600">
            Número: {formData.numero}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={formData.status === 'Concluído' ? 'default' : 'secondary'}>
            {formData.status}
          </Badge>
          <Badge variant={formData.prioridade === 'Urgente' ? 'destructive' : 'outline'}>
            {formData.prioridade}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ClienteDialog />
        <DispositivoDialog />
        <GarantiaDialog />
      </div>

      {/* Seção de Problema Relatado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Descrição do Problema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Descrição Detalhada</label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={formData.problema?.descricao || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                problema: { ...prev.problema!, descricao: e.target.value }
              }))}
              placeholder="Descreva detalhadamente o problema relatado pelo cliente"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Frequência do Problema</label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.problema?.frequencia || 'Às vezes'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  problema: { ...prev.problema!, frequencia: e.target.value as any }
                }))}
              >
                <option value="Sempre">Sempre</option>
                <option value="Frequentemente">Frequentemente</option>
                <option value="Às vezes">Às vezes</option>
                <option value="Raramente">Raramente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condições</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.problema?.condicoes || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  problema: { ...prev.problema!, condicoes: e.target.value }
                }))}
                placeholder="Ex: Apenas quando carregando"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Ações e Peças */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Reparo e Peças</h3>
        <PecasEAcoesDialog
          acoes={formData.acoes || []}
          pecas={formData.pecasSubstituidas || []}
          maoDeObra={formData.maoDeObra!}
          onUpdateAcoes={(acoes) => setFormData(prev => ({ ...prev, acoes }))}
          onUpdatePecas={(pecas) => setFormData(prev => ({ ...prev, pecasSubstituidas: pecas }))}
          onUpdateMaoDeObra={(maoDeObra) => setFormData(prev => ({ ...prev, maoDeObra }))}
        />
      </div>

      {/* Seção de Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Valores do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor das Peças</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={formData.valorPecas || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, valorPecas: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor da Mão de Obra</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={formData.valorMaoDeObra || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, valorMaoDeObra: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desconto</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded-md"
                value={formData.desconto || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, desconto: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Valor Total:</span>
              <span className="text-green-600">
                R$ {((formData.valorPecas || 0) + (formData.valorMaoDeObra || 0) - (formData.desconto || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações Especiais */}
      <ObservacoesAppleDialog
        observacoes={formData.observacoes!}
        onUpdate={(observacoes) => setFormData(prev => ({ ...prev, observacoes }))}
      />

      {/* Botões de Ação */}
      <div className="flex justify-between items-center">
        {/* Botões de Impressão */}
        <div className="flex gap-2">
          {/* Mostrar botões sempre, mas desabilitar se não há dados suficientes */}
          {formData.cliente?.nome && formData.dispositivo?.modelo ? (
            <>
              <ImpressaoOS ordem={formData as OrdemServicoApple} tipo="entrada" />
              <ImpressaoOS ordem={formData as OrdemServicoApple} tipo="saida" />
            </>
          ) : (
            <>
              <Button variant="outline" disabled className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                O.S de Entrada
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                O.S de Saída
              </Button>
            </>
          )}
        </div>
        
        {/* Botões de Ação Principal */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(formData as OrdemServicoApple)}>
            {ordem ? 'Atualizar' : 'Salvar'} Ordem de Serviço
          </Button>
        </div>
      </div>
    </div>
  )
}