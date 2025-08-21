'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Clock,
  Save,
  TestTube
} from 'lucide-react';
import { NotificationPreferences } from '@/types/notifications';

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        // Mostrar feedback de sucesso
        console.log('Preferências salvas com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('Notificação de teste enviada');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    } finally {
      setTesting(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const updateCategoryPreference = (category: string, channel: string, enabled: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: {
          ...preferences.categories[category],
          [channel]: enabled
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Erro ao carregar preferências de notificação</p>
      </div>
    );
  }

  const categories = [
    { key: 'orders', label: 'Ordens de Serviço', description: 'Notificações sobre ordens atribuídas, concluídas, etc.' },
    { key: 'payments', label: 'Pagamentos', description: 'Aprovações, rejeições e atualizações de pagamentos' },
    { key: 'users', label: 'Usuários', description: 'Convites, ativações e mudanças de usuários' },
    { key: 'system', label: 'Sistema', description: 'Manutenções, atualizações e alertas do sistema' },
    { key: 'security', label: 'Segurança', description: 'Eventos de segurança e alertas críticos' },
    { key: 'integrations', label: 'Integrações', description: 'Status de sincronizações e integrações' },
    { key: 'general', label: 'Geral', description: 'Outras notificações diversas' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações de Notificação</h2>
          <p className="text-gray-600">Gerencie como e quando você recebe notificações</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={testNotification}
            disabled={testing}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Enviando...' : 'Testar'}
          </Button>
          <Button
            onClick={savePreferences}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Canais de Notificação</span>
          </CardTitle>
          <CardDescription>
            Ative ou desative os canais de notificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <Label>Notificações In-App</Label>
                <p className="text-sm text-gray-500">Notificações dentro da aplicação</p>
              </div>
            </div>
            <Switch
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => updatePreference('inAppEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-green-500" />
              <div>
                <Label>Email</Label>
                <p className="text-sm text-gray-500">Notificações por email</p>
              </div>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <div>
                <Label>SMS</Label>
                <p className="text-sm text-gray-500">Notificações por SMS</p>
              </div>
            </div>
            <Switch
              checked={preferences.smsEnabled}
              onCheckedChange={(checked) => updatePreference('smsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-500">Notificações push no navegador</p>
              </div>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Frequência</span>
          </CardTitle>
          <CardDescription>
            Configure com que frequência receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Frequência de Notificações</Label>
            <Select
              value={preferences.frequency}
              onValueChange={(value) => updatePreference('frequency', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Imediata</SelectItem>
                <SelectItem value="hourly">A cada hora</SelectItem>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) => 
                  updatePreference('quietHours', { ...preferences.quietHours, enabled: checked })
                }
              />
              <Label>Horário Silencioso</Label>
            </div>
            
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label className="text-sm">Início</Label>
                  <Input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => 
                      updatePreference('quietHours', { 
                        ...preferences.quietHours, 
                        startTime: e.target.value 
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm">Fim</Label>
                  <Input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => 
                      updatePreference('quietHours', { 
                        ...preferences.quietHours, 
                        endTime: e.target.value 
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações por Categoria</CardTitle>
          <CardDescription>
            Configure quais tipos de notificação receber para cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category, index) => (
              <div key={category.key}>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{category.label}</h4>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 ml-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.categories[category.key]?.inApp || false}
                        onCheckedChange={(checked) => 
                          updateCategoryPreference(category.key, 'inApp', checked)
                        }
                      />
                      <Label className="text-sm">In-App</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.categories[category.key]?.email || false}
                        onCheckedChange={(checked) => 
                          updateCategoryPreference(category.key, 'email', checked)
                        }
                      />
                      <Label className="text-sm">Email</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.categories[category.key]?.sms || false}
                        onCheckedChange={(checked) => 
                          updateCategoryPreference(category.key, 'sms', checked)
                        }
                      />
                      <Label className="text-sm">SMS</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={preferences.categories[category.key]?.push || false}
                        onCheckedChange={(checked) => 
                          updateCategoryPreference(category.key, 'push', checked)
                        }
                      />
                      <Label className="text-sm">Push</Label>
                    </div>
                  </div>
                </div>
                
                {index < categories.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}