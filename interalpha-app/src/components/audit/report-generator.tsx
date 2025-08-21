'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download } from 'lucide-react'

export function ReportGenerator() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    format: 'json',
    period: '30d'
  })
  const [generating, setGenerating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    
    try {
      const response = await fetch('/api/audit/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          format: formData.format,
          filters: {
            startDate: new Date(Date.now() - (formData.period === '7d' ? 7 : formData.period === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Report generated:', result)
        // Reset form
        setFormData({
          title: '',
          description: '',
          format: 'json',
          period: '30d'
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Relatório</Label>
          <Input
            id="title"
            placeholder="Ex: Relatório Mensal de Auditoria"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o propósito deste relatório..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Formato de Exportação</Label>
        <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={generating}>
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </>
        )}
      </Button>
    </form>
  )
}