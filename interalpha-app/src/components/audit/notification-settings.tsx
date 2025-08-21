'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  MessageSquare, 
  Settings, 
  TestTube, 
  Users,
  Phone,
  Send,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface NotificationSettings {
  enableEmail: boolean
  enableSMS: boolean
  enableWhatsApp: boolean
  cooldownMinutes: number
  severityThreshold: 'low' | 'medium' | 'high' | 'critical'
}

interface NotificationRecipients {
  emails: string[]
  phones: string[]
  roles?: string[]
}

interface NotificationStats {
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
    total: number
  }
  settings: NotificationSettings
  recipients: {
    emailCount: number
    phoneCount: number
  }
  services: {
    emailConfigured: boolean
    smsConfigured: boolean
  }
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [recipients, setRecipients] = useState<NotificationRecipients | null>(null)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // Form states
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  useEffect(() => {
    fetchNotificationData()
  }, [])

  const fetchNotificationData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/notifications')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data.settings)
        setRecipients(data.data.recipients)
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error('Error fetching notification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings || !recipients) return

    try {
      setSaving(true)
      const response = await fetch('/api/audit/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          recipients
        })
      })

      if (response.ok) {
        console.log('Settings saved successfully')
        await fetchNotificationData()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTestNotifications = async (testType: 'email' | 'sms' | 'all') => {
    try {
      setTesting(true)
      const response = await fetch('/api/audit/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      })

      const data = await response.json()
      if (data.success) {
        console.log('Test results:', data.data)
        // Show success message
      }
    } catch (error) {
      console.error('Error testing notifications:', error)
    } finally {
      setTesting(false)
    }
  }

  const addEmail = () => {
    if (newEmail && recipients) {
      setRecipients({
        ...recipients,
        emails: [...recipients.emails, newEmail]
      })
      setNewEmail('')
    }
  }

  const removeEmail = (index: number) => {
    if (recipients) {
      setRecipients({
        ...recipients,
        emails: recipients.emails.filter((_, i) => i !== index)
      })
    }
  }

  const addPhone = () => {
    if (newPhone && recipients) {
      setRecipients({
        ...recipients,
        phones: [...recipients.phones, newPhone]
      })
      setNewPhone('')
    }
  }

  const removePhone = (index: number) => {
    if (recipients) {
      setRecipients({
        ...recipients,
        phones: recipients.phones.filter((_, i) => i !== index)
      })
    }
  }

  if (loading) {
    return <div>Carregando configurações de notificação...</div>
  }

  if (!settings || !recipients || !stats) {
    return <div>Erro ao carregar configurações</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="recipients">Destinatários</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="test">Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar alertas por email
                  </p>
                </div>
                <Switch
                  checked={settings.enableEmail}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enableEmail: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar alertas por SMS
                  </p>
                </div>
                <Switch
                  checked={settings.enableSMS}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enableSMS: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar WhatsApp para SMS (quando disponível)
                  </p>
                </div>
                <Switch
                  checked={settings.enableWhatsApp}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enableWhatsApp: checked })
                  }
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown (minutos)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    value={settings.cooldownMinutes}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        cooldownMinutes: parseInt(e.target.value) 
                      })
                    }
                    min="1"
                    max="1440"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Severidade Mínima</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={settings.severityThreshold}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        severityThreshold: e.target.value as any 
                      })
                    }
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Emails</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="email@exemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <Button onClick={addEmail} size="sm">
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {recipients.emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Telefones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="+5511999999999"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPhone()}
                  />
                  <Button onClick={addPhone} size="sm">
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {recipients.phones.map((phone, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{phone}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhone(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fila de Espera</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.queue.waiting}</div>
                <p className="text-xs text-muted-foreground">
                  Notificações pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processando</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.queue.active}</div>
                <p className="text-xs text-muted-foreground">
                  Sendo enviadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.queue.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Com sucesso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Falharam</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.queue.failed}</div>
                <p className="text-xs text-muted-foreground">
                  Com erro
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Serviço de Email</span>
                  </div>
                  <Badge variant={stats.services.emailConfigured ? 'default' : 'destructive'}>
                    {stats.services.emailConfigured ? 'Configurado' : 'Não Configurado'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Serviço de SMS</span>
                  </div>
                  <Badge variant={stats.services.smsConfigured ? 'default' : 'destructive'}>
                    {stats.services.smsConfigured ? 'Configurado' : 'Não Configurado'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Testar Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleTestNotifications('email')}
                  disabled={testing || !settings.enableEmail}
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Testar Email
                </Button>

                <Button
                  onClick={() => handleTestNotifications('sms')}
                  disabled={testing || !settings.enableSMS}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Testar SMS
                </Button>

                <Button
                  onClick={() => handleTestNotifications('all')}
                  disabled={testing}
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar Todos
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Os testes enviarão notificações de exemplo para verificar se o sistema está funcionando corretamente.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}