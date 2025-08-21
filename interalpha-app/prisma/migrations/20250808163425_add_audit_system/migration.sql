-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "documento" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "cep" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "valor" DOUBLE PRECISION,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "metodo" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "descricao" TEXT,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "ordemServicoId" TEXT,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "result" TEXT NOT NULL DEFAULT 'success',
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "sessionId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "location" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionDuration" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "access_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_event_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "security_event_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_event_actions" (
    "id" TEXT NOT NULL,
    "securityEventId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "automated" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,

    CONSTRAINT "security_event_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_reports" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "filters" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "downloadUrl" TEXT,

    CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reports" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "downloadUrl" TEXT,

    CONSTRAINT "compliance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_findings" (
    "id" TEXT NOT NULL,
    "complianceReportId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "recommendation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "compliance_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "archiveAfterDays" INTEGER,
    "deleteAfterDays" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastExecuted" TIMESTAMP(3),

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enableAuditLogging" BOOLEAN NOT NULL DEFAULT true,
    "enableAccessLogging" BOOLEAN NOT NULL DEFAULT true,
    "enableSecurityEvents" BOOLEAN NOT NULL DEFAULT true,
    "logRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "enableRealTimeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "alertCooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "enableAutoArchiving" BOOLEAN NOT NULL DEFAULT false,
    "archiveAfterDays" INTEGER NOT NULL DEFAULT 90,
    "enableCompliance" BOOLEAN NOT NULL DEFAULT true,
    "complianceTypes" JSONB NOT NULL DEFAULT '[]',
    "enableExport" BOOLEAN NOT NULL DEFAULT true,
    "maxExportRecords" INTEGER NOT NULL DEFAULT 100000,
    "enableAnonymization" BOOLEAN NOT NULL DEFAULT false,
    "anonymizeAfterDays" INTEGER NOT NULL DEFAULT 730,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "dataTypes" JSONB NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "includeMetadata" BOOLEAN NOT NULL DEFAULT true,
    "compression" BOOLEAN NOT NULL DEFAULT false,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "downloadUrl" TEXT,
    "filename" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_stripePaymentId_key" ON "pagamentos"("stripePaymentId");

-- CreateIndex
CREATE INDEX "audit_entries_userId_idx" ON "audit_entries"("userId");

-- CreateIndex
CREATE INDEX "audit_entries_timestamp_idx" ON "audit_entries"("timestamp");

-- CreateIndex
CREATE INDEX "audit_entries_action_idx" ON "audit_entries"("action");

-- CreateIndex
CREATE INDEX "audit_entries_resource_idx" ON "audit_entries"("resource");

-- CreateIndex
CREATE INDEX "audit_entries_result_idx" ON "audit_entries"("result");

-- CreateIndex
CREATE INDEX "access_log_entries_userId_idx" ON "access_log_entries"("userId");

-- CreateIndex
CREATE INDEX "access_log_entries_timestamp_idx" ON "access_log_entries"("timestamp");

-- CreateIndex
CREATE INDEX "access_log_entries_action_idx" ON "access_log_entries"("action");

-- CreateIndex
CREATE INDEX "access_log_entries_success_idx" ON "access_log_entries"("success");

-- CreateIndex
CREATE INDEX "access_log_entries_ipAddress_idx" ON "access_log_entries"("ipAddress");

-- CreateIndex
CREATE INDEX "security_event_entries_type_idx" ON "security_event_entries"("type");

-- CreateIndex
CREATE INDEX "security_event_entries_severity_idx" ON "security_event_entries"("severity");

-- CreateIndex
CREATE INDEX "security_event_entries_userId_idx" ON "security_event_entries"("userId");

-- CreateIndex
CREATE INDEX "security_event_entries_timestamp_idx" ON "security_event_entries"("timestamp");

-- CreateIndex
CREATE INDEX "security_event_entries_resolved_idx" ON "security_event_entries"("resolved");

-- CreateIndex
CREATE INDEX "audit_reports_generatedBy_idx" ON "audit_reports"("generatedBy");

-- CreateIndex
CREATE INDEX "audit_reports_generatedAt_idx" ON "audit_reports"("generatedAt");

-- CreateIndex
CREATE INDEX "audit_reports_format_idx" ON "audit_reports"("format");

-- CreateIndex
CREATE INDEX "compliance_reports_type_idx" ON "compliance_reports"("type");

-- CreateIndex
CREATE INDEX "compliance_reports_generatedBy_idx" ON "compliance_reports"("generatedBy");

-- CreateIndex
CREATE INDEX "compliance_reports_generatedAt_idx" ON "compliance_reports"("generatedAt");

-- CreateIndex
CREATE INDEX "compliance_reports_status_idx" ON "compliance_reports"("status");

-- CreateIndex
CREATE INDEX "alert_rules_enabled_idx" ON "alert_rules"("enabled");

-- CreateIndex
CREATE INDEX "alert_rules_createdBy_idx" ON "alert_rules"("createdBy");

-- CreateIndex
CREATE INDEX "data_retention_policies_dataType_idx" ON "data_retention_policies"("dataType");

-- CreateIndex
CREATE INDEX "data_retention_policies_enabled_idx" ON "data_retention_policies"("enabled");

-- CreateIndex
CREATE INDEX "data_retention_policies_createdBy_idx" ON "data_retention_policies"("createdBy");

-- CreateIndex
CREATE INDEX "export_jobs_requestedBy_idx" ON "export_jobs"("requestedBy");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE INDEX "export_jobs_createdAt_idx" ON "export_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_event_actions" ADD CONSTRAINT "security_event_actions_securityEventId_fkey" FOREIGN KEY ("securityEventId") REFERENCES "security_event_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_findings" ADD CONSTRAINT "compliance_findings_complianceReportId_fkey" FOREIGN KEY ("complianceReportId") REFERENCES "compliance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
