'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

import { 
  EquipamentoFormData, 
  TipoEquipamento, 
  StatusGarantia,
  DanoEquipamento,
  SeveridadeDano,
  SerialValidation,
  TIPO_EQUIPAMENTO_LABELS,
  MODELOS_APPLE,
  PROBLEMAS_COMUNS,
  validarSerialApple,
  consultarGarantiaApple
} from '@/types/equipamentos'

interface EquipamentoFormProps {
  onSubmit: (data: EquipamentoFormData) => void
  initialData?: Partial<EquipamentoFormData>
  isLoading?: boolean
}

export default function EquipamentoForm({ onSubmit, initialData, isLoading = false }: EquipamentoFormProps) {
  const [formData, setFormData] = useState<EquipamentoFormData>({
    tipo: initialData?.tipo || 'macbook_air',
    modelo: initialData?.modelo || '',
    serial_number: initialData?.serial_number || '',
    status_garantia: initialData?.status_garantia || 'verificando',
    garantia_apple_ate: initialData?.garantia_apple_ate || null,
    garantia_loja_ate: initialData?.garantia_loja_ate || null,
    fora_garantia: initialData?.fora_garantia || false,
    descricao_problema: initialData?.descricao_problema || '',
    problemas_identificados: initialData?.problemas_identificados || [],
    danos_equipamento: initialData?.danos_equipamento || [],
    observacoes: initialData?.observacoes || ''
  })

  const [serialValidation, setSerialValidation] = useState<SerialValidation | null>(null)
  const [isValidatingSerial, setIsValidatingSerial] = useState(false)
  const [isConsultingWarranty, setIsConsultingWarranty] = useState(false)
  const [novoDano, setNovoDano] = useState<DanoEquipamento>({
    tipo: '',
    descricao: '',
    severidade: 'baixa',
    observacoes: ''
  })

  // Validar serial number quando mudar
  const handleSerialChange = async (value: string) => {
    setFormData(prev => ({ ...prev, serial_number: value }))
    
    if (value.length >= 8) {
      setIsValidatingSerial(true)
      
      // Validar formato do serial
      const validation = validarSerialApple(value)
      setSerialValidation(validation)
      setIsValidatingSerial(false)
      
      // Se válido, consultar garantia automaticamente
      if (validation.isValid) {
        setIsConsultingWarranty(true)
        
        try {
          const garantiaInfo = await consultarGarantiaApple(value)
          
          // Atualizar formulário com informações da garantia
          setFormData(prev => ({
            ...prev,
            status_garantia: garantiaInfo.status,
            garantia_apple_ate: garantiaInfo.garantia_apple_ate || null,
            garantia_loja_ate: garantiaInfo.garantia_loja_ate || null,
            modelo: garantiaInfo.modelo_detectado || prev.modelo
          }))
          
        } catch (error) {
          console.error('Erro ao consultar garantia:', error)
        } finally {
          setIsConsultingWarranty(false)
        }
      }
    } else {
      setSerialValidation(null)
    }
  }

  // Adicionar problema identificado
  const adicionarProblema = (problema: string) => {
    if (!formData.problemas_identificados.includes(problema)) {
      setFormData(prev => ({
        ...prev,
        problemas_identificados: [...prev.problemas_identificados, problema]
      }))
    }
  }

  // Remover problema identificado
  const removerProblema = (problema: string) => {
    setFormData(prev => ({
      ...prev,
      problemas_identificados: prev.problemas_identificados.filter(p => p !== problema)
    }))
  }

  // Adicionar dano
  const adicionarDano = () => {
    if (novoDano.tipo && novoDano.descricao) {
      setFormData(prev => ({
        ...prev,
        danos_equipamento: [...prev.danos_equipamento, { ...novoDano }]
      }))
      setNovoDano({
        tipo: '',
        descricao: '',
        severidade: 'baixa',
        observacoes: ''
      })
    }
  }

  // Remover dano
  const removerDano = (index: number) => {
    setFormData(prev => ({
      ...prev,
      danos_equipamento: prev.danos_equipamento.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Equipamento</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: TipoEquipamento) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_EQUIPAMENTO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Select 
                value={formData.modelo} 
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, modelo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS_APPLE[formData.tipo]?.map((modelo: string) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="serial">Serial Number</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="serial"
                value={formData.serial_number}
                onChange={(e) => handleSerialChange(e.target.value)}
                placeholder="Digite o serial number"
                className="flex-1"
              />
              {serialValidation && (
                <div className="flex items-center">
                  {serialValidation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {serialValidation && (
              <div className={`text-sm mt-1 ${serialValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {serialValidation.message}
                {serialValidation.info && serialValidation.info.ano && (
                  <div className="text-xs text-gray-500 mt-1">
                    Ano: {serialValidation.info.ano} | Semana: {serialValidation.info.semana}
                  </div>
                )}
              </div>
            )}
            {isValidatingSerial && (
              <div className="text-sm text-blue-600 mt-1">Validando serial number...</div>
            )}
            {isConsultingWarranty && (
              <div className="text-sm text-blue-600 mt-1">Consultando garantia Apple...</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Garantia */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Garantia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="status_garantia">Status da Garantia</Label>
            <Select 
              value={formData.status_garantia} 
              onValueChange={(value: StatusGarantia) => setFormData(prev => ({ ...prev, status_garantia: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verificando">Verificando</SelectItem>
                <SelectItem value="ativa_apple">Garantia Apple Ativa</SelectItem>
                <SelectItem value="ativa_loja">Garantia da Loja Ativa</SelectItem>
                <SelectItem value="expirada">Garantia Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Garantia Apple até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.garantia_apple_ate ? (
                      format(formData.garantia_apple_ate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.garantia_apple_ate || undefined}
                    onSelect={(date: Date | undefined) => setFormData(prev => ({ ...prev, garantia_apple_ate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Garantia da Loja até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.garantia_loja_ate ? (
                      format(formData.garantia_loja_ate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.garantia_loja_ate || undefined}
                    onSelect={(date: Date | undefined) => setFormData(prev => ({ ...prev, garantia_loja_ate: date || null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fora_garantia"
              checked={formData.fora_garantia}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, fora_garantia: checked }))}
            />
            <Label htmlFor="fora_garantia">Equipamento fora da garantia</Label>
          </div>
        </CardContent>
      </Card>

      {/* Problemas */}
      <Card>
        <CardHeader>
          <CardTitle>Problemas Reportados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="descricao_problema">Descrição do Problema</Label>
            <Textarea
              id="descricao_problema"
              value={formData.descricao_problema}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao_problema: e.target.value }))}
              placeholder="Descreva detalhadamente o problema reportado pelo cliente"
              rows={4}
            />
          </div>

          <div>
            <Label>Problemas Comuns Identificados</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {PROBLEMAS_COMUNS[formData.tipo]?.map((problema: string) => (
                <Button
                  key={problema}
                  type="button"
                  variant={formData.problemas_identificados.includes(problema) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (formData.problemas_identificados.includes(problema)) {
                      removerProblema(problema)
                    } else {
                      adicionarProblema(problema)
                    }
                  }}
                  className="text-xs"
                >
                  {problema}
                </Button>
              ))}
            </div>
          </div>

          {formData.problemas_identificados.length > 0 && (
            <div>
              <Label>Problemas Selecionados</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.problemas_identificados.map((problema: string) => (
                  <Badge key={problema} variant="secondary" className="flex items-center gap-1">
                    {problema}
                    <button
                      type="button"
                      onClick={() => removerProblema(problema)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danos */}
      <Card>
        <CardHeader>
          <CardTitle>Danos no Equipamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="tipo_dano">Tipo de Dano</Label>
              <Input
                id="tipo_dano"
                value={novoDano.tipo}
                onChange={(e) => setNovoDano(prev => ({ ...prev, tipo: e.target.value }))}
                placeholder="Ex: Tela quebrada, Dano por líquido"
              />
            </div>

            <div>
              <Label htmlFor="severidade_dano">Severidade</Label>
              <Select 
                value={novoDano.severidade} 
                onValueChange={(value: SeveridadeDano) => setNovoDano(prev => ({ ...prev, severidade: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descricao_dano">Descrição do Dano</Label>
              <Textarea
                id="descricao_dano"
                value={novoDano.descricao}
                onChange={(e) => setNovoDano(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o dano em detalhes"
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observacoes_dano">Observações</Label>
              <Input
                id="observacoes_dano"
                value={novoDano.observacoes}
                onChange={(e) => setNovoDano(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="button"
                onClick={adicionarDano}
                disabled={!novoDano.tipo || !novoDano.descricao}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dano
              </Button>
            </div>
          </div>

          {formData.danos_equipamento.length > 0 && (
            <div className="space-y-2">
              <Label>Danos Registrados</Label>
              {formData.danos_equipamento.map((dano, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={dano.severidade === 'alta' ? 'destructive' : dano.severidade === 'media' ? 'default' : 'secondary'}>
                        {dano.severidade}
                      </Badge>
                      <span className="font-medium">{dano.tipo}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{dano.descricao}</p>
                    {dano.observacoes && (
                      <p className="text-xs text-gray-500 mt-1">{dano.observacoes}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerDano(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            placeholder="Observações adicionais sobre o equipamento ou atendimento"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Equipamento'}
        </Button>
      </div>
    </form>
  )
}