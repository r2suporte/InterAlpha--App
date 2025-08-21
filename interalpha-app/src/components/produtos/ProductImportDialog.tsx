'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye
} from 'lucide-react'
import { useProductImport } from '@/hooks/use-product-import'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ProductImportDialog({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: ProductImportDialogProps) {
  const { 
    importFromFile, 
    validateFile, 
    clearResult, 
    isImporting, 
    importProgress, 
    importResult 
  } = useProductImport()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileValidation, setFileValidation] = useState<{ valid: boolean, errors: string[] } | null>(null)
  const [options, setOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateOnly: false
  })
  const [showResults, setShowResults] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    
    // Validar arquivo
    const validation = await validateFile(file)
    setFileValidation(validation)
    
    // Limpar resultados anteriores
    clearResult()
    setShowResults(false)
  }

  const handleImport = async () => {
    if (!selectedFile) return

    const result = await importFromFile(selectedFile, options)
    
    if (result.success) {
      setShowResults(true)
      onImportComplete?.()
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setFileValidation(null)
    clearResult()
    setShowResults(false)
    onOpenChange(false)
  }

  const handleDownloadTemplate = () => {
    // Criar template CSV básico
    const csvContent = `Part Number,Descrição,Preço de Custo,Preço de Venda,Ativo
PROD-001,"Produto de exemplo 1",50.00,75.00,true
PROD-002,"Produto de exemplo 2",100.00,150.00,true`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template_importacao_produtos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const canImport = selectedFile && fileValidation?.valid && !isImporting

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Produtos
          </DialogTitle>
          <DialogDescription>
            Importe produtos em lote usando arquivos CSV ou JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showResults ? (
            <>
              {/* Upload de Arquivo */}
              <div className="space-y-4">
                <Label>Selecionar Arquivo</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      {selectedFile ? (
                        selectedFile.name.endsWith('.csv') ? (
                          <FileText className="h-12 w-12 text-green-500" />
                        ) : (
                          <Database className="h-12 w-12 text-blue-500" />
                        )
                      ) : (
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Escolher Outro Arquivo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Arraste um arquivo aqui</p>
                        <p className="text-sm text-muted-foreground">
                          ou clique para selecionar
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Selecionar Arquivo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Formatos suportados: CSV, JSON (máximo 10MB)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Template
                  </Button>
                </div>
              </div>

              {/* Validação do Arquivo */}
              {fileValidation && (
                <div className="space-y-2">
                  {fileValidation.valid ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Arquivo válido e pronto para importação.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p>Problemas encontrados no arquivo:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {fileValidation.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Opções de Importação */}
              {selectedFile && fileValidation?.valid && (
                <div className="space-y-4">
                  <Label>Opções de Importação</Label>
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipDuplicates"
                        checked={options.skipDuplicates}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                        }
                      />
                      <Label htmlFor="skipDuplicates" className="text-sm">
                        Pular produtos duplicados (mesmo Part Number)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="updateExisting"
                        checked={options.updateExisting}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, updateExisting: checked as boolean }))
                        }
                      />
                      <Label htmlFor="updateExisting" className="text-sm">
                        Atualizar produtos existentes
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="validateOnly"
                        checked={options.validateOnly}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, validateOnly: checked as boolean }))
                        }
                      />
                      <Label htmlFor="validateOnly" className="text-sm">
                        Apenas validar (não importar)
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando produtos...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}
            </>
          ) : (
            /* Resultados da Importação */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resultados da Importação</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(false)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Voltar
                </Button>
              </div>

              {importResult?.data && (
                <>
                  {/* Resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.data.summary.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.data.summary.imported}
                      </div>
                      <div className="text-sm text-muted-foreground">Importados</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {importResult.data.summary.errors}
                      </div>
                      <div className="text-sm text-muted-foreground">Erros</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {importResult.data.summary.duplicates}
                      </div>
                      <div className="text-sm text-muted-foreground">Duplicados</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {importResult.data.summary.skipped}
                      </div>
                      <div className="text-sm text-muted-foreground">Ignorados</div>
                    </div>
                  </div>

                  {/* Detalhes dos Erros */}
                  {importResult.data.results.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Erros ({importResult.data.results.errors.length})
                      </Label>
                      <ScrollArea className="h-32 border rounded-lg p-3">
                        <div className="space-y-2">
                          {importResult.data.results.errors.map((error: any, index: number) => (
                            <div key={index} className="text-sm">
                              <Badge variant="destructive" className="mr-2">
                                Linha {error.row}
                              </Badge>
                              <span className="font-medium">{error.partNumber}</span>
                              <span className="text-muted-foreground ml-2">- {error.error}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Produtos Duplicados */}
                  {importResult.data.results.duplicates.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Duplicados ({importResult.data.results.duplicates.length})
                      </Label>
                      <ScrollArea className="h-32 border rounded-lg p-3">
                        <div className="space-y-2">
                          {importResult.data.results.duplicates.map((duplicate: any, index: number) => (
                            <div key={index} className="text-sm">
                              <Badge variant="secondary" className="mr-2">
                                Linha {duplicate.row}
                              </Badge>
                              <span className="font-medium">{duplicate.partNumber}</span>
                              <span className="text-muted-foreground ml-2">- {duplicate.reason}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Produtos Importados com Sucesso */}
                  {importResult.data.results.success.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Importados com Sucesso ({importResult.data.results.success.length})
                      </Label>
                      <ScrollArea className="h-32 border rounded-lg p-3">
                        <div className="space-y-2">
                          {importResult.data.results.success.slice(0, 10).map((success: any, index: number) => (
                            <div key={index} className="text-sm">
                              <Badge variant="default" className="mr-2">
                                {success.action === 'created' ? 'Criado' : 'Atualizado'}
                              </Badge>
                              <span className="font-medium">{success.partNumber}</span>
                            </div>
                          ))}
                          {importResult.data.results.success.length > 10 && (
                            <div className="text-sm text-muted-foreground">
                              ... e mais {importResult.data.results.success.length - 10} produtos
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter>
          {!showResults ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!canImport}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>Importando...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {options.validateOnly ? 'Validar' : 'Importar'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}