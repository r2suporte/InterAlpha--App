"use client"

import { useState } from "react"
import { ClientSearch } from "./client-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  User, 
  Smartphone, 
  Wrench, 
  Package, 
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Hash,
  Monitor,
  Cpu,
  HardDrive,
  Battery,
  Keyboard,
  MousePointer,
  Camera,
  Speaker,
  Zap,
  Fan,
  Calendar,
  Shield,
  DollarSign,
  Sparkles,
  Laptop,
  Tablet,
  Watch
} from "lucide-react"

interface ServicePart {
  id: string
  name: string
  quantity: number
  price: number
}

interface ServiceOrderData {
  deviceType: string
  deviceModel: string
  serialNumber: string
  reportedDefect: string
  damages: string
  defectDescription: string
  solution: string
  parts: ServicePart[]
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  serviceType: string
  priority: string
  preferredDate: string
  observations: string
}

const APPLE_DEVICES = {
  "MacBook Pro": [
    "MacBook Pro 13\" M2 (2022)",
    "MacBook Pro 14\" M2 Pro/Max (2023)",
    "MacBook Pro 16\" M2 Pro/Max (2023)",
    "MacBook Pro 13\" M1 (2020)",
    "MacBook Pro 14\" M1 Pro/Max (2021)",
    "MacBook Pro 16\" M1 Pro/Max (2021)",
    "MacBook Pro 13\" Intel (2020)",
    "MacBook Pro 16\" Intel (2019-2020)"
  ],
  "MacBook Air": [
    "MacBook Air 13\" M2 (2022)",
    "MacBook Air 15\" M2 (2023)",
    "MacBook Air 13\" M1 (2020)",
    "MacBook Air 13\" Intel (2020)"
  ],
  "Mac Mini": [
    "Mac Mini M2 (2023)",
    "Mac Mini M2 Pro (2023)",
    "Mac Mini M1 (2020)",
    "Mac Mini Intel (2018)"
  ],
  "Mac Studio": [
    "Mac Studio M2 Max (2023)",
    "Mac Studio M2 Ultra (2023)",
    "Mac Studio M1 Max (2022)",
    "Mac Studio M1 Ultra (2022)"
  ],
  "Mac Pro": [
    "Mac Pro M2 Ultra (2023)",
    "Mac Pro Intel (2019)"
  ],
  "iPad": [
    "iPad Pro 12.9\" M2 (2022)",
    "iPad Pro 11\" M2 (2022)",
    "iPad Pro 12.9\" M1 (2021)",
    "iPad Pro 11\" M1 (2021)",
    "iPad Air M1 (2022)",
    "iPad Air 4ª geração (2020)",
    "iPad 10ª geração (2022)",
    "iPad 9ª geração (2021)",
    "iPad Mini 6ª geração (2021)"
  ]
}

const COMMON_PARTS = [
  { name: "Tela LCD/OLED", price: 450.00, icon: Monitor },
  { name: "Bateria", price: 180.00, icon: Battery },
  { name: "Teclado", price: 320.00, icon: Keyboard },
  { name: "Trackpad", price: 150.00, icon: MousePointer },
  { name: "Placa Lógica", price: 800.00, icon: Cpu },
  { name: "SSD 256GB", price: 280.00, icon: HardDrive },
  { name: "SSD 512GB", price: 450.00, icon: HardDrive },
  { name: "SSD 1TB", price: 680.00, icon: HardDrive },
  { name: "Memória RAM 8GB", price: 220.00, icon: Cpu },
  { name: "Memória RAM 16GB", price: 380.00, icon: Cpu },
  { name: "Cabo Flex", price: 45.00, icon: Zap },
  { name: "Alto-falante", price: 80.00, icon: Speaker },
  { name: "Webcam", price: 120.00, icon: Camera },
  { name: "Conector de Carregamento", price: 90.00, icon: Zap },
  { name: "Ventilador/Cooler", price: 110.00, icon: Fan }
]

const FORM_STEPS = [
  { id: 1, title: "Cliente", icon: User, description: "Informações do cliente" },
  { id: 2, title: "Dispositivo", icon: Smartphone, description: "Dados do equipamento" },
  { id: 3, title: "Diagnóstico", icon: Wrench, description: "Análise técnica" },
  { id: 4, title: "Peças", icon: Package, description: "Componentes utilizados" }
]

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  endereco: string
  numero_cliente: string
  created_at: string
}

interface OrdemServicoCriada {
  id: string
  numero_os: string
  created_at: string
}

export function ServiceOrderForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [ordemCriada, setOrdemCriada] = useState<OrdemServicoCriada | null>(null)
  
  const [formData, setFormData] = useState<ServiceOrderData>({
    deviceType: "",
    deviceModel: "",
    serialNumber: "",
    reportedDefect: "",
    damages: "",
    defectDescription: "",
    solution: "",
    parts: [],
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    serviceType: "",
    priority: "",
    preferredDate: "",
    observations: ""
  })

  const handleInputChange = (field: keyof ServiceOrderData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleClientSelect = (client: Cliente) => {
    setSelectedClient(client)
    setFormData(prev => ({
      ...prev,
      customerName: client.nome,
      customerEmail: client.email,
      customerPhone: client.telefone,
      customerAddress: client.endereco
    }))
    setShowManualForm(false)
    // Limpar erros dos campos de cliente
    setErrors(prev => ({
      ...prev,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: ""
    }))
  }

  const handleNewClient = () => {
    setSelectedClient(null)
    setShowManualForm(true)
    setFormData(prev => ({
      ...prev,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: ""
    }))
  }

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'customerName':
        return value.length < 2 ? 'Nome deve ter pelo menos 2 caracteres' : ''
      case 'customerEmail':
        return !/\S+@\S+\.\S+/.test(value) ? 'Email inválido' : ''
      case 'customerPhone':
        return value.length < 10 ? 'Telefone deve ter pelo menos 10 dígitos' : ''
      case 'deviceType':
        return !value ? 'Selecione o tipo de dispositivo' : ''
      case 'deviceModel':
        return value.length < 2 ? 'Modelo deve ter pelo menos 2 caracteres' : ''
      case 'serialNumber':
        return value.length < 5 ? 'Número de série deve ter pelo menos 5 caracteres' : ''
      case 'reportedDefect':
        return !value ? 'Selecione o problema relatado' : ''
      case 'defectDescription':
        return value.length < 10 ? 'Descrição deve ter pelo menos 10 caracteres' : ''
      default:
        return ''
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 1:
        // Se um cliente foi selecionado, não precisa validar os campos
        if (selectedClient) {
          break
        }
        // Se está no formulário manual, validar os campos
        if (showManualForm) {
          newErrors.customerName = validateField('customerName', formData.customerName)
          newErrors.customerEmail = validateField('customerEmail', formData.customerEmail)
          newErrors.customerPhone = validateField('customerPhone', formData.customerPhone)
        } else {
          // Se não tem cliente selecionado e não está no formulário manual, precisa selecionar um cliente
          newErrors.client = 'Selecione um cliente ou cadastre um novo'
        }
        break
      case 2:
        newErrors.deviceType = validateField('deviceType', formData.deviceType)
        newErrors.deviceModel = validateField('deviceModel', formData.deviceModel)
        newErrors.serialNumber = validateField('serialNumber', formData.serialNumber)
        break
      case 3:
        newErrors.reportedDefect = validateField('reportedDefect', formData.reportedDefect)
        newErrors.defectDescription = validateField('defectDescription', formData.defectDescription)
        break
    }
    
    const hasErrors = Object.values(newErrors).some(error => error !== '')
    setErrors(newErrors)
    return !hasErrors
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const addPart = (name: string, price: number) => {
    const existingPart = formData.parts.find(p => p.name === name)
    if (existingPart) {
      updatePartQuantity(existingPart.id, existingPart.quantity + 1)
    } else {
      const newPart: ServicePart = {
        id: Date.now().toString(),
        name,
        quantity: 1,
        price
      }
      setFormData(prev => ({ ...prev, parts: [...prev.parts, newPart] }))
    }
  }

  const removePart = (id: string) => {
    setFormData(prev => ({ ...prev, parts: prev.parts.filter(p => p.id !== id) }))
  }

  const updatePartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removePart(id)
    } else {
      setFormData(prev => ({
        ...prev,
        parts: prev.parts.map(p => p.id === id ? { ...p, quantity } : p)
      }))
    }
  }

  const getDeviceIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'macbook':
      case 'macbook pro':
      case 'macbook air':
      case 'imac':
      case 'mac mini':
      case 'mac studio':
      case 'mac pro':
        return Laptop
      case 'ipad':
      case 'ipad pro':
      case 'ipad air':
      case 'ipad mini':
        return Tablet
      case 'apple watch':
        return Watch
      case 'iphone':
      default:
        return Smartphone
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'text-green-600 bg-green-100'
      case 'normal': return 'text-blue-600 bg-blue-100'
      case 'alta': return 'text-orange-600 bg-orange-100'
      case 'urgente': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderStepIndicator = () => (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-6">
        {FORM_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`
                relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                ${isActive 
                  ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="mt-3 text-center">
                <div className={`text-sm font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">{step.description}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
        <div 
          className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${(currentStep / FORM_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-600 mt-3">
        <span className="font-medium">Etapa {currentStep} de {FORM_STEPS.length}</span>
        <span className="font-medium">{Math.round((currentStep / FORM_STEPS.length) * 100)}% concluído</span>
      </div>
    </div>
  )

  const renderFormField = (field: string, label: string, type: string = 'text', options?: string[], placeholder?: string) => {
    const fieldValidation = errors[field]
    const value = formData[field as keyof ServiceOrderData] as string

    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {label}
          {fieldValidation && <CheckCircle className="w-4 h-4 text-green-500" />}
        </Label>
        
        {type === 'select' && options ? (
          <Select value={value} onValueChange={(val) => handleInputChange(field as keyof ServiceOrderData, val)}>
            <SelectTrigger className={`h-12 rounded-xl border-2 transition-colors ${fieldValidation ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === 'textarea' ? (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field as keyof ServiceOrderData, e.target.value)}
            placeholder={placeholder}
            className={`min-h-[100px] rounded-xl border-2 transition-colors resize-none ${fieldValidation ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
          />
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(field as keyof ServiceOrderData, e.target.value)}
            placeholder={placeholder}
            className={`h-12 rounded-xl border-2 transition-colors ${fieldValidation ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
          />
        )}
        
        {fieldValidation && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {fieldValidation}
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Inserir ordem de serviço no banco
      const { data: novaOS, error } = await supabase
        .from('ordens_servico')
        .insert({
          cliente_id: selectedClient?.id,
          tipo_dispositivo: formData.deviceType,
          modelo_dispositivo: formData.deviceModel,
          numero_serie: formData.serialNumber,
          defeito_relatado: formData.reportedDefect,
          danos_aparentes: formData.damages,
          descricao_defeito: formData.defectDescription,
          solucao: formData.solution,
          tipo_servico: formData.serviceType,
          prioridade: formData.priority,
          data_preferencial: formData.preferredDate || null,
          observacoes: formData.observations,
          status: 'aguardando_diagnostico'
        })
        .select('id, numero_os, created_at')
        .single()

      if (error) {
        console.error('Erro ao criar ordem de serviço:', error)
        alert('Erro ao criar ordem de serviço: ' + error.message)
        return
      }

      // Inserir peças utilizadas
      if (formData.parts.length > 0) {
        const pecasData = formData.parts.map(part => ({
          ordem_servico_id: novaOS.id,
          nome: part.name,
          quantidade: part.quantity,
          preco_unitario: part.price,
          preco_total: part.quantity * part.price
        }))

        const { error: pecasError } = await supabase
          .from('pecas_utilizadas')
          .insert(pecasData)

        if (pecasError) {
          console.error('Erro ao inserir peças:', pecasError)
        }
      }

      // Armazenar a OS criada no estado
      setOrdemCriada(novaOS)
      
      alert(`Ordem de serviço criada com sucesso!\nNúmero da OS: ${novaOS.numero_os}`)
      
      // Reset do formulário
      setFormData({
        deviceType: '',
        deviceModel: '',
        serialNumber: '',
        reportedDefect: '',
        damages: '',
        defectDescription: '',
        solution: '',
        parts: [],
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        serviceType: '',
        priority: '',
        preferredDate: '',
        observations: ''
      })
      setSelectedClient(null)
      setCurrentStep(1)
      
    } catch (error) {
      console.error('Erro ao enviar:', error)
      alert('Erro ao criar ordem de serviço')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <User className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Informações do Cliente</CardTitle>
              <CardDescription className="text-blue-100 text-center text-lg">
                Busque um cliente existente ou cadastre um novo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!selectedClient && !showManualForm && (
                <div className="space-y-4">
                  <ClientSearch 
                    onClientSelect={handleClientSelect}
                    onCreateNew={handleNewClient}
                  />
                  {errors.client && (
                    <div className="text-red-500 text-sm font-medium">
                      {errors.client}
                    </div>
                  )}
                </div>
              )}
              
              {selectedClient && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-green-800">Cliente Selecionado</h3>
                      <p className="text-green-600">{selectedClient.nome} - {selectedClient.numero_cliente}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNewClient}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Alterar Cliente
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome</Label>
                      <p className="text-gray-900">{selectedClient.nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                      <p className="text-gray-900">{selectedClient.telefone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-gray-900">{selectedClient.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Endereço</Label>
                      <p className="text-gray-900">{selectedClient.endereco}</p>
                    </div>
                  </div>
                </div>
              )}

              {showManualForm && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Cadastrar Novo Cliente</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowManualForm(false)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Buscar Cliente
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFormField('customerName', 'Nome Completo', 'text', undefined, 'Ex: João Silva Santos')}
                    {renderFormField('customerPhone', 'Telefone', 'tel', undefined, '(11) 99999-9999')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderFormField('customerEmail', 'Email', 'email', undefined, 'joao@email.com')}
                    {renderFormField('customerAddress', 'Endereço Completo', 'text', undefined, 'Rua, número, bairro, cidade')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 2:
        const DeviceIcon = getDeviceIcon(formData.deviceType)
        return (
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <DeviceIcon className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Informações do Dispositivo</CardTitle>
              <CardDescription className="text-purple-100 text-center text-lg">
                Detalhes sobre o equipamento que será reparado
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField('deviceType', 'Tipo de Dispositivo', 'select', 
                  ['iPhone', 'iPad', 'MacBook', 'iMac', 'Apple Watch', 'Mac mini', 'Mac Studio', 'Outro'], 'Selecione o tipo')}
                {renderFormField('deviceModel', 'Modelo', 'text', undefined, 'Ex: iPhone 14 Pro Max')}
              </div>
              <div className="space-y-6">
                {renderFormField('serialNumber', 'Número de Série', 'text', undefined, 'Ex: C02XK0AAHV29')}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-red-50">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <Wrench className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Diagnóstico Técnico</CardTitle>
              <CardDescription className="text-orange-100 text-center text-lg">
                Análise detalhada do problema encontrado
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField('reportedDefect', 'Problema Relatado', 'select',
                  ['Tela quebrada', 'Não liga', 'Bateria viciada', 'Problema de software', 'Dano por líquido', 'Botões não funcionam', 'Alto-falante', 'Microfone', 'Câmera', 'Outro'], 'Selecione o problema')}
                {renderFormField('damages', 'Condição Geral', 'select',
                  ['Excelente', 'Boa', 'Regular', 'Ruim', 'Péssima'], 'Avalie a condição')}
              </div>
              <div className="space-y-6">
                {renderFormField('defectDescription', 'Descrição Detalhada', 'textarea', undefined, 'Descreva detalhadamente o problema, quando começou, circunstâncias...')}
                {renderFormField('solution', 'Solução Aplicada', 'textarea', undefined, 'Descreva a solução técnica aplicada para resolver o problema...')}
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-amber-50">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <Package className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Peças e Orçamento</CardTitle>
              <CardDescription className="text-yellow-100 text-center text-lg">
                Componentes necessários para o reparo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <Alert className="border-blue-200 bg-blue-50 rounded-xl">
                <Shield className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Importante:</strong> As peças serão confirmadas após diagnóstico técnico detalhado. Os valores são estimativas baseadas no mercado atual.
                </AlertDescription>
              </Alert>
              
              {/* Peças Comuns */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Peças Mais Utilizadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COMMON_PARTS.map((part) => {
                    const Icon = part.icon
                    const isSelected = formData.parts.some(p => p.name === part.name)
                    return (
                      <div
                        key={part.name}
                        className={`
                          p-4 border-2 rounded-xl transition-all cursor-pointer group hover:shadow-lg
                          ${isSelected 
                            ? 'border-green-400 bg-green-50 shadow-md' 
                            : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                          }
                        `}
                        onClick={() => addPart(part.name, part.price)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            p-2 rounded-lg transition-colors
                            ${isSelected 
                              ? 'bg-green-200' 
                              : 'bg-yellow-100 group-hover:bg-yellow-200'
                            }
                          `}>
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{part.name}</div>
                            <div className="text-sm text-gray-600">R$ {part.price.toFixed(2)}</div>
                          </div>
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Plus className="h-5 w-5 text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Peças Selecionadas */}
              {formData.parts.length > 0 && (
                <div className="space-y-6">
                  <Separator />
                  <h3 className="text-lg font-bold text-gray-800">Peças Selecionadas ({formData.parts.length})</h3>
                  <div className="space-y-3">
                    {formData.parts.map((part) => (
                      <Card key={part.id} className="p-4 border border-green-200 bg-green-50/50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{part.name}</div>
                            <div className="text-sm text-gray-600">R$ {part.price.toFixed(2)} cada</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updatePartQuantity(part.id, part.quantity - 1)}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">{part.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updatePartQuantity(part.id, part.quantity + 1)}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                +
                              </Button>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                R$ {(part.quantity * part.price).toFixed(2)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePart(part.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-green-100">Total Estimado</span>
                        <div className="text-2xl font-bold">
                          R$ {formData.parts.reduce((total, part) => total + (part.quantity * part.price), 0).toFixed(2)}
                        </div>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-200" />
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Ordem de Serviço</h1>
          <p className="text-gray-600 text-lg">Sistema de gestão técnica profissional</p>
        </div>

        {ordemCriada && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Ordem de Serviço Criada com Sucesso!
                  </h3>
                  <p className="text-green-700">
                    Número da OS: <span className="font-mono font-bold">{ordemCriada.numero_os}</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Criada em: {new Date(ordemCriada.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOrdemCriada(null)}
                  className="ml-auto"
                >
                  Nova OS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {renderStepIndicator()}

        <form onSubmit={handleSubmit} className="space-y-8">
          {renderCurrentStep()}

          <div className="flex justify-between items-center pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-8 py-3 rounded-xl"
            >
              Anterior
            </Button>

            <div className="flex gap-4">
              {currentStep < FORM_STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Finalizar Ordem
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}