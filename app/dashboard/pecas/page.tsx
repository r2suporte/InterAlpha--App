'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Package, DollarSign, TrendingUp, AlertTriangle, MapPin, Calendar, User, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataField } from '@/components/ui/data-display'
import { StatusBadge } from '@/components/ui/status-badge'
import PecaForm from '@/components/PecaForm'
import { 
  Peca, 
  CategoriaPeca, 
  StatusPeca, 
  Fornecedor,
  CATEGORIA_PECA_LABELS,
  STATUS_PECA_LABELS,
  calcularMargemLucro
} from '@/types/pecas'

// Dados mock para demonstração
const mockPecas: Peca[] = [
  {
    id: '1',
    part_number: 'APL-SCR-13-M1',
    nome: 'Tela LCD MacBook Air 13" M1',
    descricao: 'Tela LCD completa para MacBook Air 13" M1 2020-2022',
    categoria: 'tela',
    marca: 'Apple',
    modelo_compativel: ['MacBook Air 13" M1'],
    preco_custo: 450.00,
    preco_venda: 650.00,
    margem_lucro: calcularMargemLucro(450.00, 650.00),
    quantidade_estoque: 15,
    estoque_minimo: 5,
    status: 'disponivel',
    localizacao_estoque: 'A1-B2',
    fornecedor_id: '1',
    codigo_fornecedor: 'LCD-MBA13-M1',
    garantia_meses: 12,
    ativo: true,
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15'),
    created_by: 'admin'
  },
  {
    id: '2',
    part_number: 'APL-BAT-13-M2',
    nome: 'Bateria MacBook Air 13" M2',
    descricao: 'Bateria original para MacBook Air 13" M2 2022-2024',
    categoria: 'bateria',
    marca: 'Apple',
    modelo_compativel: ['MacBook Air 13" M2'],
    preco_custo: 180.00,
    preco_venda: 280.00,
    margem_lucro: calcularMargemLucro(180.00, 280.00),
    quantidade_estoque: 8,
    estoque_minimo: 10,
    status: 'baixo_estoque',
    localizacao_estoque: 'B2-C1',
    fornecedor_id: '1',
    codigo_fornecedor: 'BAT-MBA13-M2',
    garantia_meses: 6,
    ativo: true,
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10'),
    created_by: 'admin'
  },
  {
    id: '3',
    part_number: 'APL-KB-14-M3',
    nome: 'Teclado MacBook Pro 14" M3',
    descricao: 'Teclado completo com backlight para MacBook Pro 14" M3',
    categoria: 'outros',
    marca: 'Apple',
    modelo_compativel: ['MacBook Pro 14" M3'],
    preco_custo: 320.00,
    preco_venda: 480.00,
    margem_lucro: calcularMargemLucro(320.00, 480.00),
    quantidade_estoque: 0,
    estoque_minimo: 3,
    status: 'sem_estoque',
    localizacao_estoque: 'C1-D2',
    fornecedor_id: '2',
    codigo_fornecedor: 'KB-MBP14-M3',
    garantia_meses: 12,
    ativo: true,
    created_at: new Date('2024-01-05'),
    updated_at: new Date('2024-01-05'),
    created_by: 'admin'
  }
]

const mockFornecedores: Fornecedor[] = [
  {
    id: '1',
    nome: 'TechParts Brasil',
    cnpj: '12.345.678/0001-90',
    contato: 'João Silva',
    email: 'joao@techparts.com.br',
    telefone: '(11) 99999-9999',
    ativo: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    nome: 'Apple Parts Supply',
    cnpj: '98.765.432/0001-10',
    contato: 'Maria Santos',
    email: 'maria@appleparts.com.br',
    telefone: '(11) 88888-8888',
    ativo: true,
    created_at: new Date(),
    updated_at: new Date()
  }
]

export default function PecasPage() {
  const [pecas, setPecas] = useState<Peca[]>(mockPecas)
  const [fornecedores] = useState<Fornecedor[]>(mockFornecedores)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [pecaEditando, setPecaEditando] = useState<Peca | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  
  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaPeca | 'todas'>('todas')
  const [filtroStatus, setFiltroStatus] = useState<StatusPeca | 'todos'>('todos')

  // Filtrar peças
  const pecasFiltradas = pecas.filter(peca => {
    const matchBusca = busca === '' || 
      peca.nome.toLowerCase().includes(busca.toLowerCase()) ||
      peca.part_number.toLowerCase().includes(busca.toLowerCase()) ||
      peca.descricao.toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = filtroCategoria === 'todas' || peca.categoria === filtroCategoria
    const matchStatus = filtroStatus === 'todos' || peca.status === filtroStatus
    
    return matchBusca && matchCategoria && matchStatus
  })

  // Métricas
  const metricas = {
    totalPecas: pecas.length,
    valorTotalEstoque: pecas.reduce((total, peca) => total + (peca.preco_custo * peca.quantidade_estoque), 0),
    pecasBaixoEstoque: pecas.filter(peca => peca.status === 'baixo_estoque').length,
    pecasSemEstoque: pecas.filter(peca => peca.status === 'sem_estoque').length,
    margemLucroMedia: pecas.reduce((total, peca) => total + peca.margem_lucro, 0) / pecas.length
  }

  // Handlers
  const handleSubmitPeca = async (data: any) => {
    setIsLoading(true)
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (pecaEditando) {
        // Editar peça existente
        setPecas(prev => prev.map(peca => 
          peca.id === pecaEditando.id 
            ? { 
                ...peca, 
                ...data,
                preco_custo: parseFloat(data.preco_custo),
                preco_venda: parseFloat(data.preco_venda),
                margem_lucro: calcularMargemLucro(parseFloat(data.preco_custo), parseFloat(data.preco_venda)),
                updated_at: new Date()
              }
            : peca
        ))
      } else {
        // Adicionar nova peça
        const novaPeca: Peca = {
          id: Date.now().toString(),
          part_number: data.part_number,
          nome: data.nome,
          descricao: data.descricao,
          categoria: data.categoria,
          marca: data.marca || '',
          preco_custo: parseFloat(data.preco_custo),
          preco_venda: parseFloat(data.preco_venda),
          margem_lucro: calcularMargemLucro(parseFloat(data.preco_custo), parseFloat(data.preco_venda)),
          quantidade_estoque: parseInt(data.estoque_atual) || 0,
          estoque_minimo: parseInt(data.estoque_minimo) || 0,
          status: data.status,
          localizacao_estoque: data.localizacao,
          fornecedor_id: data.fornecedor_id,
          codigo_fornecedor: data.codigo_fornecedor,
          garantia_meses: parseInt(data.garantia_meses) || 12,
          ativo: true,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin'
        }
        setPecas(prev => [...prev, novaPeca])
      }
      
      setMostrarFormulario(false)
      setPecaEditando(undefined)
      
    } catch (error) {
      console.error('Erro ao salvar peça:', error)
      alert('Erro ao salvar peça')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditarPeca = (peca: Peca) => {
    setPecaEditando(peca)
    setMostrarFormulario(true)
  }

  const handleExcluirPeca = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
      setPecas(prev => prev.filter(peca => peca.id !== id))
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }



  if (mostrarFormulario) {
    return (
      <div className="container mx-auto py-8 px-4">
        <PecaForm
          peca={pecaEditando}
          onSubmit={handleSubmitPeca}
          onCancel={() => {
            setMostrarFormulario(false)
            setPecaEditando(undefined)
          }}
          fornecedores={fornecedores}
          isLoading={isLoading}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Peças</h1>
          <p className="text-gray-600">
            Cadastro e controle de estoque de peças para assistência técnica Apple
          </p>
        </div>
        <Button 
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Peça
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peças</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalPecas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(metricas.valorTotalEstoque)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.margemLucroMedia.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metricas.pecasBaixoEstoque}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metricas.pecasSemEstoque}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, part number ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filtroCategoria} onValueChange={(value) => setFiltroCategoria(value as CategoriaPeca | 'todas')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {Object.entries(CATEGORIA_PECA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as StatusPeca | 'todos')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_PECA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Peças */}
      <Card>
        <CardHeader>
          <CardTitle>Peças Cadastradas ({pecasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pecasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma peça encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Part Number</th>
                    <th className="text-left py-3 px-4 font-medium">Nome</th>
                    <th className="text-left py-3 px-4 font-medium">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium">Estoque</th>
                    <th className="text-left py-3 px-4 font-medium">Custo</th>
                    <th className="text-left py-3 px-4 font-medium">Venda</th>
                    <th className="text-left py-3 px-4 font-medium">Lucro</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pecasFiltradas.map((peca) => (
                    <tr key={peca.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{peca.part_number}</div>
                        <DataField 
                          label="Código Fornecedor"
                          icon="hash" 
                          value={peca.codigo_fornecedor} 
                          className="text-sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{peca.nome}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{peca.descricao}</div>
                        <DataField 
                          label="Localização"
                          icon="mapPin" 
                          value={peca.localizacao_estoque} 
                          className="text-sm mt-1"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {CATEGORIA_PECA_LABELS[peca.categoria]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{peca.quantidade_estoque}</div>
                        <div className="text-sm text-gray-500">Min: {peca.estoque_minimo}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatarMoeda(peca.preco_custo)}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatarMoeda(peca.preco_venda)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-green-600">
                          {peca.margem_lucro.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatarMoeda(peca.preco_venda - peca.preco_custo)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge 
                          status={peca.status === 'disponivel' ? 'success' : 
                                 peca.status === 'baixo_estoque' ? 'warning' :
                                 peca.status === 'sem_estoque' ? 'error' :
                                 peca.status === 'em_pedido' ? 'pending' : 'info'}
                          text={STATUS_PECA_LABELS[peca.status]}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditarPeca(peca)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExcluirPeca(peca.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}