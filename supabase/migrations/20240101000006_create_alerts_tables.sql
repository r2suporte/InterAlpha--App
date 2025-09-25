-- Tabela para regras de alerta
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    metric VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'not_equals')),
    threshold DECIMAL(10,2) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN DEFAULT true,
    cooldown_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para alertas disparados
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    threshold DECIMAL(10,2) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para notificações de alertas
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'webhook', 'in_app')),
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at 
    BEFORE UPDATE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_notifications_updated_at 
    BEFORE UPDATE ON alert_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para alert_rules (apenas usuários autenticados podem ver/modificar)
CREATE POLICY "Usuários autenticados podem ver regras de alerta" ON alert_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir regras de alerta" ON alert_rules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar regras de alerta" ON alert_rules
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar regras de alerta" ON alert_rules
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para alerts (apenas usuários autenticados podem ver/modificar)
CREATE POLICY "Usuários autenticados podem ver alertas" ON alerts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir alertas" ON alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar alertas" ON alerts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar alertas" ON alerts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para alert_notifications (apenas usuários autenticados podem ver/modificar)
CREATE POLICY "Usuários autenticados podem ver notificações de alerta" ON alert_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir notificações de alerta" ON alert_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar notificações de alerta" ON alert_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar notificações de alerta" ON alert_notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE alert_rules IS 'Regras de alerta para monitoramento de métricas';
COMMENT ON TABLE alerts IS 'Alertas disparados baseados nas regras configuradas';
COMMENT ON TABLE alert_notifications IS 'Notificações enviadas para os alertas';

COMMENT ON COLUMN alert_rules.metric IS 'Nome da métrica a ser monitorada';
COMMENT ON COLUMN alert_rules.condition IS 'Condição de comparação (greater_than, less_than, equals, not_equals)';
COMMENT ON COLUMN alert_rules.threshold IS 'Valor limite para disparar o alerta';
COMMENT ON COLUMN alert_rules.cooldown_minutes IS 'Tempo mínimo entre alertas da mesma regra';

COMMENT ON COLUMN alerts.current_value IS 'Valor atual da métrica quando o alerta foi disparado';
COMMENT ON COLUMN alerts.status IS 'Status do alerta (active, resolved, acknowledged)';

COMMENT ON COLUMN alert_notifications.channel IS 'Canal de notificação (email, sms, webhook, in_app)';
COMMENT ON COLUMN alert_notifications.recipient IS 'Destinatário da notificação';