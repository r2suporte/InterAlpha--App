'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react'

export function ComplianceReports() {
  const complianceTypes = [
    {
      id: 'lgpd',
      name: 'LGPD',
      description: 'Lei Geral de Proteção de Dados',
      status: 'compliant',
      lastCheck: '2024-01-15'
    },
    {
      id: 'sox',
      name: 'SOX',
      description: 'Sarbanes-Oxley Act',
      status: 'partial',
      lastCheck: '2024-01-10'
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Gestão de Segurança da Informação',
      status: 'compliant',
      lastCheck: '2024-01-12'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'default'
      case 'partial': return 'secondary'
      case 'non_compliant': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4" />
      case 'partial': return <AlertTriangle className="h-4 w-4" />
      case 'non_compliant': return <AlertTriangle className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compliant': return 'Conforme'
      case 'partial': return 'Parcialmente Conforme'
      case 'non_compliant': return 'Não Conforme'
      default: return 'Desconhecido'
    }
  }

  return (
    <div className="space-y-4">
      {complianceTypes.map((compliance) => (
        <Card key={compliance.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>{compliance.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {compliance.description}
                </p>
              </div>
              <Badge variant={getStatusColor(compliance.status) as any} className="flex items-center space-x-1">
                {getStatusIcon(compliance.status)}
                <span>{getStatusText(compliance.status)}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Última verificação: {new Date(compliance.lastCheck).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" size="sm">
                  Verificar Agora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}