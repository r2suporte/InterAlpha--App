'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Search, FileText } from 'lucide-react'
import { 
  isValidCPF, 
  isValidCNPJ, 
  formatCPF, 
  formatCNPJ,
  consultarCPF,
  consultarCNPJ 
} from '@/lib/utils/document-validation'

interface DocumentValidationDialogProps {
  onDocumentValidated: (data: {
    documento: string
    tipoDocumento: 'CPF' | 'CNPJ'
    nome?: string
    endereco?: {
      logradouro: string
      numero: string
      bairro: string
      municipio: string
      uf: string
      cep: string
    }
  }) => void
}

export function DocumentValidationDialog({ onDocumentValidated }: DocumentValidationDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [documento, setDocumento] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<'CPF' | 'CNPJ'>('CPF')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleDocumentChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    
    // Auto-detectar tipo baseado no comprimento
    if (cleanValue.length <= 11) {
      setTipoDocumento('CPF')
      setDocumento(formatCPF(cleanValue))
    } else {
      setTipoDocumento('CNPJ')
      setDocumento(formatCNPJ(cleanValue))
    }
    
    setValidationResult(null)
    setError('')
  }

  const validateDocument = async () => {
    if (!documento) {
      setError('Digite um documento')
      return
    }

    setIsValidating(true)
    setError('')
    setValidationResult(null)

    try {
      const endpoint = tipoDocumento === 'CPF' ? '/api/clientes/validate-cpf' : '/api/clientes/validate-cnpj'
      const field = tipoDocumento === 'CPF' ? 'cpf' : 'cnpj'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: documento })
      })

      const result = await response.json()
      setValidationResult(result)
      
      if (!result.valid) {
        setError(result.error || `${tipoDocumento} inválido`)
      }
    } catch (err) {
      setError('Erro ao validar documento')
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = () => {
    if (validationResult?.valid) {
      onDocumentValidated({
        documento,
        tipoDocumento,
        nome: validationResult.nome || validationResult.name,
        endereco: validationResult.endereco
      })
      setIsOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setDocumento('')
    setTipoDocumento('CPF')
    setValidationResult(null)
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Validar Documento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Validação de Documento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tipo de Documento */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipoDocumento === 'CPF' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTipoDocumento('CPF')
                setDocumento('')
                setValidationResult(null)
                setError('')
              }}
            >
              CPF
            </Button>
            <Button
              type="button"
              variant={tipoDocumento === 'CNPJ' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTipoDocumento('CNPJ')
                setDocumento('')
                setValidationResult(null)
                setError('')
              }}
            >
              CNPJ
            </Button>
          </div>

          {/* Campo do Documento */}
          <div className="space-y-2">
            <Label htmlFor="documento">
              {tipoDocumento === 'CPF' ? 'CPF' : 'CNPJ'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="documento"
                value={documento}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder={tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={tipoDocumento === 'CPF' ? 14 : 18}
              />
              <Button
                type="button"
                onClick={validateDocument}
                disabled={isValidating || !documento}
                size="sm"
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Resultado da Validação */}
          {validationResult && validationResult.valid && (
            <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Documento válido</span>
              </div>
              
              {validationResult.nome && (
                <div>
                  <Label className="text-sm text-gray-600">Nome/Razão Social</Label>
                  <p className="font-medium">{validationResult.nome}</p>
                </div>
              )}
              
              {validationResult.fantasia && (
                <div>
                  <Label className="text-sm text-gray-600">Nome Fantasia</Label>
                  <p className="font-medium">{validationResult.fantasia}</p>
                </div>
              )}
              
              {validationResult.situacao && (
                <div>
                  <Label className="text-sm text-gray-600">Situação</Label>
                  <Badge variant={validationResult.situacao === 'ATIVA' ? 'default' : 'secondary'}>
                    {validationResult.situacao}
                  </Badge>
                </div>
              )}
              
              {validationResult.endereco && (
                <div>
                  <Label className="text-sm text-gray-600">Endereço</Label>
                  <p className="text-sm">
                    {validationResult.endereco.logradouro}, {validationResult.endereco.numero}<br/>
                    {validationResult.endereco.bairro} - {validationResult.endereco.municipio}/{validationResult.endereco.uf}<br/>
                    CEP: {validationResult.endereco.cep}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!validationResult?.valid}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}