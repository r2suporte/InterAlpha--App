'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Save, Settings } from 'lucide-react'

interface AuditConfig {
  enableAuditLogging: boolean
  enableAccessLogging: boolean
  enableSecurityEvents: boolean
  logRetentionDays: number
  enableRealTimeAlerts: boolean
  alertCooldownMinutes: number
  enableAutoArchiving: boolean
  archiveAfterDays: number
  enableCompliance: boolean
  enableExport: boolean
  maxExportRecords: number
  enableAnonymization: boolean
  anonymizeAfterDays: number
}

export function AuditConfigForm() {
  const [config, setConfig] = useState<AuditConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.data)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      const response = await fetch('/api/audit/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        console.log('Configuration saved successfully')
      }
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof AuditConfig, value: any) => {
    if (!config) return
    setConfig(prev => prev ? { ...prev, [key]: value } : null)
  }

  if (loading) {
    return <div>Carregando configurações...</div>
  }

  if (!config) {
    return <div>Erro ao carregar configurações</div>
  }

  return (
    <div className="space-y-6">
      {/* Logging Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Logging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Logs de Auditoria</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas as ações dos usuários
              </p>
            </div>
            <Switch
              checked={config.enableAuditLogging}
              onCheckedChange={(checked) => updateConfig('enableAuditLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Logs de Acesso</Label>
              <p className="text-sm text-muted-foreground">
                Registrar logins, logouts e tentativas de acesso
              </p>
            </div>
            <Switch
              checked={config.enableAccessLogging}
              onCheckedChange={(checked) => updateConfig('enableAccessLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Eventos de Segurança</Label>
              <p className="text-sm text-muted-foreground">
                Detectar e registrar eventos de segurança
              </p>
            </div>
            <Switch
              checked={config.enableSecurityEvents}
              onCheckedChange={(checked) => updateConfig('enableSecurityEvents', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Retenção de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logRetentionDays">Período de Retenção (dias)</Label>
              <Input
                id="logRetentionDays"
                type="number"
                value={config.logRetentionDays}
                onChange={(e) => updateConfig('logRetentionDays', parseInt(e.target.value))}
                min="30"
                max="3650"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="archiveAfterDays">Arquivar Após (dias)</Label>
              <Input
                id="archiveAfterDays"
                type="number"
                value={config.archiveAfterDays}
                onChange={(e) => updateConfig('archiveAfterDays', parseInt(e.target.value))}
                min="30"
                max="365"
                disabled={!config.enableAutoArchiving}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Arquivamento Automático</Label>
              <p className="text-sm text-muted-foreground">
                Mover dados antigos para arquivo automaticamente
              </p>
            </div>
            <Switch
              checked={config.enableAutoArchiving}
              onCheckedChange={(checked) => updateConfig('enableAutoArchiving', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas em Tempo Real</Label>
              <p className="text-sm text-muted-foreground">
                Enviar alertas imediatos para eventos críticos
              </p>
            </div>
            <Switch
              checked={config.enableRealTimeAlerts}
              onCheckedChange={(checked) => updateConfig('enableRealTimeAlerts', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertCooldownMinutes">Cooldown de Alertas (minutos)</Label>
            <Input
              id="alertCooldownMinutes"
              type="number"
              value={config.alertCooldownMinutes}
              onChange={(e) => updateConfig('alertCooldownMinutes', parseInt(e.target.value))}
              min="1"
              max="1440"
              disabled={!config.enableRealTimeAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Exportação</Label>
              <p className="text-sm text-muted-foreground">
                Permitir exportação de dados de auditoria
              </p>
            </div>
            <Switch
              checked={config.enableExport}
              onCheckedChange={(checked) => updateConfig('enableExport', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxExportRecords">Máximo de Registros por Exportação</Label>
            <Input
              id="maxExportRecords"
              type="number"
              value={config.maxExportRecords}
              onChange={(e) => updateConfig('maxExportRecords', parseInt(e.target.value))}
              min="1000"
              max="1000000"
              disabled={!config.enableExport}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Anonimização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Anonimizar dados pessoais após período especificado
              </p>
            </div>
            <Switch
              checked={config.enableAnonymization}
              onCheckedChange={(checked) => updateConfig('enableAnonymization', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anonymizeAfterDays">Anonimizar Após (dias)</Label>
            <Input
              id="anonymizeAfterDays"
              type="number"
              value={config.anonymizeAfterDays}
              onChange={(e) => updateConfig('anonymizeAfterDays', parseInt(e.target.value))}
              min="365"
              max="3650"
              disabled={!config.enableAnonymization}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}