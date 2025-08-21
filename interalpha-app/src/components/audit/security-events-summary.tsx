'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Clock 
} from 'lucide-react'

interface SecuritySummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  resolved: number
  pending: number
}

export function SecurityEventsSummary() {
  const [summary, setSummary] = useState<SecuritySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      // Dados mock para demonstração
      const mockSummary: SecuritySummary = {
        total: 15,
        critical: 2,
        high: 3,
        medium: 6,
        low: 4,
        resolved: 10,
        pending: 5
      }
      setSummary(mockSummary)
    } catch (error) {
      console.error('Error fetching security summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total}</div>
          <div className="flex items-center space-x-2 text-xs">
            <Badge variant="secondary">{summary.pending} pendentes</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
          <div className="flex items-center space-x-2 text-xs">
            <Badge variant="destructive">{summary.high} alta prioridade</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Resolvidos</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{summary.resolved}</div>
          <p className="text-xs text-muted-foreground">
            {Math.round((summary.resolved / summary.total) * 100)}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eventos Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{summary.pending}</div>
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-muted-foreground">Requer atenção</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}