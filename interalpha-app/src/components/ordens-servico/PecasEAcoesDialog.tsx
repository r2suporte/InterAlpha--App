'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { AcaoReparo, PecaSubstituida, MaoDeObra } from '@/types/ordem-servico-apple'

interface PecasEAcoesDialogProps {
  acoes: AcaoReparo[]
  pecas: PecaSubstituida[]
  maoDeObra: MaoDeObra
  onUpdateAcoes: (acoes: AcaoReparo[]) => void
  onUpdatePecas: (pecas: PecaSubstituida[]) => void
  onUpdateMaoDeObra: (maoDeObra: MaoDeObra) => void
}

export function PecasEAcoesDialog({ 
  acoes, 
  pecas, 
  maoDeObra, 
  onUpdateAcoes, 
  onUpdatePecas, 
  onUpdateMaoDeObra 
}: PecasEAcoesDialogProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [editingAcao, setEditingAcao] = useState<AcaoReparo | null>(null)
  const [editingPeca, setEditingPeca] = useState<PecaSubstituida | null>(null)

  // Formulário para nova ação
  const [novaAcao, setNovaAcao] = useState<Partial<AcaoReparo>>({
    descricao: '',
    tecnico: '',
    tempo: 30,
    resultado: 'Sucesso',
    observacoes: ''
  })

  // Formulário para nova peça
  const [novaPeca, setNovaPeca] = useState<Partial<PecaSubstituida>>({
    codigo: '',
    nome: '',
    categoria: 'Tela',
    preco: 0,
    fornecedor: '',
    garantia: 90
  })

  const adicionarAcao = () => {
    const acao: AcaoReparo = {
      id: Date.now().toString(),
      descricao: novaAcao.descricao!,
      tecnico: novaAcao.tecnico!,
      dataHora: new Date(),
      tempo: novaAcao.tempo!,
      resultado: novaAcao.resultado!,
      observacoes: novaAcao.observacoes
    }
    onUpdateAcoes([...acoes, acao])
    setNovaAcao({ descricao: '', tecnico: '', tempo: 30, resultado: 'Sucesso', observacoes: '' })
  }

  const adicionarPeca = () => {
    const peca: PecaSubstituida = {
      id: Date.now().toString(),
      codigo: novaPeca.codigo!,
      nome: novaPeca.nome!,
      categoria: novaPeca.categoria!,
      preco: novaPeca.preco!,
      fornecedor: novaPeca.fornecedor!,
      garantia: novaPeca.garantia!,
      numeroSerie: novaPeca.numeroSerie
    }
    onUpdatePecas([...pecas, peca])
    setNovaPeca({ codigo: '', nome: '', categoria: 'Tela', preco: 0, fornecedor: '', garantia: 90 })
  }

  const removerAcao = (id: string) => {
    onUpdateAcoes(acoes.filter(a => a.id !== id))
  }

  const removerPeca = (id: string) => {
    onUpdatePecas(pecas.filter(p => p.id !== id))
  }

  const valorTotalPecas = pecas.reduce((total, peca) => total + peca.preco, 0)
  const tempoTotalAcoes = acoes.reduce((total, acao) => total + acao.tempo, 0)

  // Dialog para Ações de Reparo
  const AcoesDialog = () => (
    <Dialog open={activeDialog === 'acoes'} onOpenChange={(open) => setActiveDialog(open ? 'acoes' : null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Wrench className="h-4 w-4 mr-2" />
          Ações de Reparo ({acoes.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ações de Reparo Realizadas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Lista de ações existentes */}
          <div className="space-y-3">
            {acoes.map((acao) => (
              <Card key={acao.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={acao.resultado === 'Sucesso' ? 'default' : 'destructive'}>
                          {acao.resultado}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {acao.dataHora.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="font-medium">{acao.descricao}</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{acao.tecnico}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{acao.tempo} min</span>
                        </div>
                      </div>
                      {acao.observacoes && (
                        <p className="text-sm text-gray-600 mt-2">{acao.observacoes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerAcao(acao.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulário para nova ação */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Nova Ação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição da Ação</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={novaAcao.descricao || ''}
                    onChange={(e) => setNovaAcao(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Substituição da tela LCD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Técnico Responsável</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={novaAcao.tecnico || ''}
                    onChange={(e) => setNovaAcao(prev => ({ ...prev, tecnico: e.target.value }))}
                    placeholder="Nome do técnico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempo Gasto (minutos)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={novaAcao.tempo || 30}
                    onChange={(e) => setNovaAcao(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resultado</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={novaAcao.resultado || 'Sucesso'}
                    onChange={(e) => setNovaAcao(prev => ({ ...prev, resultado: e.target.value as any }))}
                  >
                    <option value="Sucesso">Sucesso</option>
                    <option value="Falha">Falha</option>
                    <option value="Parcial">Parcial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  value={novaAcao.observacoes || ''}
                  onChange={(e) => setNovaAcao(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais sobre a ação realizada"
                />
              </div>
              <Button 
                onClick={adicionarAcao}
                disabled={!novaAcao.descricao || !novaAcao.tecnico}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Ação
              </Button>
            </CardContent>
          </Card>

          {/* Resumo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Resumo das Ações</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total de Ações:</span>
                <span className="ml-2 font-medium">{acoes.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Tempo Total:</span>
                <span className="ml-2 font-medium">{tempoTotalAcoes} min</span>
              </div>
              <div>
                <span className="text-gray-600">Sucessos:</span>
                <span className="ml-2 font-medium text-green-600">
                  {acoes.filter(a => a.resultado === 'Sucesso').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setActiveDialog(null)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Dialog para Peças Substituídas
  const PecasDialog = () => (
    <Dialog open={activeDialog === 'pecas'} onOpenChange={(open) => setActiveDialog(open ? 'pecas' : null)}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Package className="h-4 w-4 mr-2" />
          Peças Substituídas ({pecas.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Peças Substituídas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Lista de peças existentes */}
          <div className="space-y-3">
            {pecas.map((peca) => (
              <Card key={peca.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{peca.categoria}</Badge>
                        <Badge variant="secondary">{peca.codigo}</Badge>
                      </div>
                      <h4 className="font-medium">{peca.nome}</h4>
                      <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>R$ {peca.preco.toFixed(2)}</span>
                        </div>
                        <div>
                          <span>Fornecedor: {peca.fornecedor}</span>
                        </div>
                        <div>
                          <span>Garantia: {peca.garantia} dias</span>
                        </div>
                      </div>
                      {peca.numeroSerie && (
                        <p className="text-sm text-gray-600 mt-1 font-mono">
                          S/N: {peca.numeroSerie}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerPeca(peca.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulário para nova peça */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Nova Peça
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Código da Peça</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.codigo || ''}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: LCD-IP14-BLK"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Peça</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.nome || ''}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Tela LCD iPhone 14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.categoria || 'Tela'}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, categoria: e.target.value as any }))}
                  >
                    <option value="Tela">Tela</option>
                    <option value="Bateria">Bateria</option>
                    <option value="Camera">Câmera</option>
                    <option value="Alto-falante">Alto-falante</option>
                    <option value="Microfone">Microfone</option>
                    <option value="Conector">Conector</option>
                    <option value="Placa">Placa</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.preco || 0}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, preco: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fornecedor</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.fornecedor || ''}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, fornecedor: e.target.value }))}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Garantia (dias)</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={novaPeca.garantia || 90}
                    onChange={(e) => setNovaPeca(prev => ({ ...prev, garantia: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Número de Série (opcional)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={novaPeca.numeroSerie || ''}
                  onChange={(e) => setNovaPeca(prev => ({ ...prev, numeroSerie: e.target.value }))}
                  placeholder="Número de série da peça"
                />
              </div>
              <Button 
                onClick={adicionarPeca}
                disabled={!novaPeca.codigo || !novaPeca.nome || !novaPeca.fornecedor}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Peça
              </Button>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Resumo Financeiro</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total de Peças:</span>
                <span className="ml-2 font-medium">{pecas.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Valor Total:</span>
                <span className="ml-2 font-medium text-green-600">
                  R$ {valorTotalPecas.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Valor Médio:</span>
                <span className="ml-2 font-medium">
                  R$ {pecas.length > 0 ? (valorTotalPecas / pecas.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setActiveDialog(null)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AcoesDialog />
      <PecasDialog />
    </div>
  )
}