'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Shield, 
  Database, 
  Key, 
  AlertTriangle, 
  Lightbulb,
  Plus,
  Trash2,
  Apple
} from 'lucide-react'
import { ObservacoesEspeciais } from '@/types/ordem-servico-apple'

interface ObservacoesAppleDialogProps {
  observacoes: ObservacoesEspeciais
  onUpdate: (observacoes: ObservacoesEspeciais) => void
}

export function ObservacoesAppleDialog({ observacoes, onUpdate }: ObservacoesAppleDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [novoDadoImportante, setNovoDadoImportante] = useState('')
  const [novaRestricao, setNovaRestricao] = useState('')
  const [novaRecomendacao, setNovaRecomendacao] = useState('')

  const adicionarDadoImportante = () => {
    if (novoDadoImportante.trim()) {
      onUpdate({
        ...observacoes,
        dadosImportantes: [...observacoes.dadosImportantes, novoDadoImportante.trim()]
      })
      setNovoDadoImportante('')
    }
  }

  const removerDadoImportante = (index: number) => {
    onUpdate({
      ...observacoes,
      dadosImportantes: observacoes.dadosImportantes.filter((_, i) => i !== index)
    })
  }

  const adicionarRestricao = () => {
    if (novaRestricao.trim()) {
      onUpdate({
        ...observacoes,
        restricoes: [...observacoes.restricoes, novaRestricao.trim()]
      })
      setNovaRestricao('')
    }
  }

  const removerRestricao = (index: number) => {
    onUpdate({
      ...observacoes,
      restricoes: observacoes.restricoes.filter((_, i) => i !== index)
    })
  }

  const adicionarRecomendacao = () => {
    if (novaRecomendacao.trim()) {
      onUpdate({
        ...observacoes,
        recomendacoes: [...observacoes.recomendacoes, novaRecomendacao.trim()]
      })
      setNovaRecomendacao('')
    }
  }

  const removerRecomendacao = (index: number) => {
    onUpdate({
      ...observacoes,
      recomendacoes: observacoes.recomendacoes.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <FileText className="h-4 w-4 mr-2" />
          Observações Especiais
          {(observacoes.backupNecessario || observacoes.senhaIdApple || 
            observacoes.dadosImportantes.length > 0 || observacoes.restricoes.length > 0) && (
            <Badge variant="secondary" className="ml-2">
              {[
                observacoes.backupNecessario ? 1 : 0,
                observacoes.senhaIdApple ? 1 : 0,
                observacoes.dadosImportantes.length,
                observacoes.restricoes.length
              ].reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Observações Especiais - Dispositivos Apple
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Backup e ID Apple */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-4 w-4" />
                Backup e ID Apple
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="backup"
                  checked={observacoes.backupNecessario}
                  onChange={(e) => onUpdate({
                    ...observacoes,
                    backupNecessario: e.target.checked
                  })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="backup" className="text-sm font-medium">
                  Backup necessário antes do reparo
                </label>
              </div>
              
              {observacoes.backupNecessario && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Atenção: Backup Obrigatório</p>
                      <p>Realize backup completo dos dados antes de iniciar o reparo. Dados podem ser perdidos durante o processo.</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Key className="h-4 w-4 inline mr-1" />
                  Senha do ID Apple (se necessário)
                </label>
                <input
                  type="password"
                  className="w-full p-2 border rounded-md"
                  value={observacoes.senhaIdApple || ''}
                  onChange={(e) => onUpdate({
                    ...observacoes,
                    senhaIdApple: e.target.value
                  })}
                  placeholder="Senha do ID Apple (apenas se fornecida pelo cliente)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Informação sensível - manter confidencial
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dados Importantes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Dados Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {observacoes.dadosImportantes.map((dado, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                    <span className="text-sm">{dado}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerDadoImportante(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md text-sm"
                  value={novoDadoImportante}
                  onChange={(e) => setNovoDadoImportante(e.target.value)}
                  placeholder="Ex: Fotos de família no rolo da câmera"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarDadoImportante()}
                />
                <Button onClick={adicionarDadoImportante} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Exemplos comuns:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Fotos e vídeos pessoais</li>
                  <li>Contatos importantes</li>
                  <li>Aplicativos de trabalho</li>
                  <li>Configurações personalizadas</li>
                  <li>Dados de aplicativos bancários</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Restrições */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Restrições e Limitações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {observacoes.restricoes.map((restricao, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                    <span className="text-sm">{restricao}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerRestricao(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md text-sm"
                  value={novaRestricao}
                  onChange={(e) => setNovaRestricao(e.target.value)}
                  placeholder="Ex: Não remover película protetora"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarRestricao()}
                />
                <Button onClick={adicionarRestricao} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Exemplos comuns:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Não formatar o dispositivo</li>
                  <li>Manter configurações específicas</li>
                  <li>Não atualizar o iOS</li>
                  <li>Preservar jailbreak (se aplicável)</li>
                  <li>Não remover aplicativos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recomendações Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {observacoes.recomendacoes.map((recomendacao, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <span className="text-sm">{recomendacao}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerRecomendacao(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded-md text-sm"
                  value={novaRecomendacao}
                  onChange={(e) => setNovaRecomendacao(e.target.value)}
                  placeholder="Ex: Instalar película protetora após reparo"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarRecomendacao()}
                />
                <Button onClick={adicionarRecomendacao} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>Exemplos comuns:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>Atualizar para iOS mais recente</li>
                  <li>Instalar proteção de tela</li>
                  <li>Usar capa protetora</li>
                  <li>Configurar backup automático</li>
                  <li>Verificar bateria periodicamente</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Observações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={4}
                value={observacoes.observacoesGerais}
                onChange={(e) => onUpdate({
                  ...observacoes,
                  observacoesGerais: e.target.value
                })}
                placeholder="Observações adicionais sobre o reparo, comportamento do cliente, condições especiais, etc."
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Salvar Observações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}