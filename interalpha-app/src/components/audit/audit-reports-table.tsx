'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye } from 'lucide-react'

export function AuditReportsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Relatórios de Auditoria</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhum relatório encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Gere seu primeiro relatório de auditoria
          </p>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}