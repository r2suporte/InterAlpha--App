# Schema Updates Needed for Clerk Migration

## Tables to Add to Prisma Schema

### 1. comunicacoes_cliente
Table for logging client communications (SMS, Email, WhatsApp)

```prisma
model ComunicacaoCliente {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clientePortalId   String?   @map("cliente_portal_id") @db.Uuid
  ordemServicoId    String?   @map("ordem_servico_id") @db.Uuid
  clienteTelefone   String?   @map("cliente_telefone") @db.VarChar(20)
  tipo              String    @db.VarChar(20) // 'email', 'sms', 'whatsapp'
  conteudo          String    @db.Text
  destinatario      String    @db.VarChar(255)
  status            String    @db.VarChar(20) // 'enviado', 'erro', 'pendente'
  provider          String?   @db.VarChar(50) // 'twilio', 'nodemailer', 'whatsapp'
  messageId         String?   @map("message_id") @db.VarChar(255)
  erro              String?   @db.Text
  dataEnvio         DateTime  @default(now()) @map("data_envio") @db.Timestamptz
  enviadoEm         DateTime? @map("enviado_em") @db.Timestamptz
  
  ordemServico      OrdemServico? @relation(fields: [ordemServicoId], references: [id])
  
  @@map("comunicacoes_cliente")
}
```

### 2. communication_metrics
Table for storing communication service metrics

```prisma
model CommunicationMetric {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  service      String    @db.VarChar(50) // 'email', 'sms', 'whatsapp', 'communication'
  operation    String    @db.VarChar(100)
  durationMs   Int       @map("duration_ms")
  success      Boolean   @default(true)
  errorMessage String?   @map("error_message") @db.Text
  metadata     Json?
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz
  
  @@map("communication_metrics")
  @@index([service, createdAt])
  @@index([operation, createdAt])
}
```

### 3. application_metrics
Table for application-wide metrics

```prisma
model ApplicationMetric {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  metricName  String    @map("metric_name") @db.VarChar(100)
  category    String    @db.VarChar(50) // 'performance', 'error', 'system'
  operation   String?   @db.VarChar(100)
  value       Float?
  duration    Int?
  success     Boolean?  @default(true)
  metadata    Json?
  timestamp   DateTime  @default(now()) @db.Timestamptz
  
  @@map("application_metrics")
  @@index([metricName, timestamp])
  @@index([category, timestamp])
}
```

### 4. alert_rules
Table for alert rules configuration

```prisma
model AlertRule {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String    @unique @db.VarChar(255)
  description      String    @db.Text
  metric           String    @db.VarChar(100)
  condition        String    @db.VarChar(20) // 'greater_than', 'less_than', 'equals', 'not_equals'
  threshold        Float
  severity         String    @db.VarChar(20) // 'low', 'medium', 'high', 'critical'
  enabled          Boolean   @default(true)
  cooldownMinutes  Int       @map("cooldown_minutes") @default(15)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  
  alerts           Alert[]
  
  @@map("alert_rules")
}
```

### 5. alerts
Table for triggered alerts

```prisma
model Alert {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ruleId           String    @map("rule_id") @db.Uuid
  ruleName         String    @map("rule_name") @db.VarChar(255)
  metric           String    @db.VarChar(100)
  currentValue     Float     @map("current_value")
  threshold        Float
  severity         String    @db.VarChar(20)
  message          String    @db.Text
  status           String    @default("active") @db.VarChar(20) // 'active', 'resolved', 'acknowledged'
  triggeredAt      DateTime  @default(now()) @map("triggered_at") @db.Timestamptz
  resolvedAt       DateTime? @map("resolved_at") @db.Timestamptz
  acknowledgedAt   DateTime? @map("acknowledged_at") @db.Timestamptz
  acknowledgedBy   String?   @map("acknowledged_by") @db.VarChar(255)
  
  rule             AlertRule @relation(fields: [ruleId], references: [id])
  notifications    AlertNotification[]
  
  @@map("alerts")
  @@index([status, triggeredAt])
}
```

### 6. alert_notifications
Table for alert notifications

```prisma
model AlertNotification {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  alertId      String    @map("alert_id") @db.Uuid
  channel      String    @db.VarChar(20) // 'email', 'sms', 'webhook', 'in_app'
  recipient    String    @db.VarChar(255)
  status       String    @default("pending") @db.VarChar(20) // 'pending', 'sent', 'failed'
  sentAt       DateTime? @map("sent_at") @db.Timestamptz
  errorMessage String?   @map("error_message") @db.Text
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz
  
  alert        Alert     @relation(fields: [alertId], references: [id])
  
  @@map("alert_notifications")
}
```

## Migration Steps

1. Add the models above to `prisma/schema.prisma`
2. Run `npx prisma format` to format the schema
3. Run `npx prisma db push` to apply changes to the database
4. Run `npx prisma generate` to update Prisma Client
5. Uncomment the database operations in the updated services:
   - `lib/services/sms-service.ts` - logCommunication method
   - `lib/services/email-service.ts` - registrarComunicacao method
   - `lib/services/metrics-service.ts` - recordMetric and getPerformanceStats methods
   - `lib/services/alert-service.ts` - all database operations
   - `lib/services/application-metrics.ts` - all database operations

## Notes

- All services have been updated to use Prisma imports
- Database operations are commented out with TODO markers
- Services will work with in-memory data until schema is updated
- Console logging is in place for debugging
