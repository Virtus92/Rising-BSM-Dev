-- CreateTable
CREATE TABLE "AutomationWebhook" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "entityType" VARCHAR(50) NOT NULL,
    "operation" VARCHAR(20) NOT NULL,
    "webhookUrl" VARCHAR(500) NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "payloadTemplate" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "retryDelaySeconds" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "AutomationWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSchedule" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "cronExpression" VARCHAR(100) NOT NULL,
    "webhookUrl" VARCHAR(500) NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecution" (
    "id" SERIAL NOT NULL,
    "automationType" VARCHAR(20) NOT NULL,
    "automationId" INTEGER NOT NULL,
    "entityId" INTEGER,
    "entityType" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "executedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retryAttempt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationWebhook_entityType_idx" ON "AutomationWebhook"("entityType");

-- CreateIndex
CREATE INDEX "AutomationWebhook_operation_idx" ON "AutomationWebhook"("operation");

-- CreateIndex
CREATE INDEX "AutomationWebhook_active_idx" ON "AutomationWebhook"("active");

-- CreateIndex
CREATE INDEX "AutomationWebhook_createdBy_idx" ON "AutomationWebhook"("createdBy");

-- CreateIndex
CREATE INDEX "AutomationSchedule_active_idx" ON "AutomationSchedule"("active");

-- CreateIndex
CREATE INDEX "AutomationSchedule_nextRunAt_idx" ON "AutomationSchedule"("nextRunAt");

-- CreateIndex
CREATE INDEX "AutomationSchedule_createdBy_idx" ON "AutomationSchedule"("createdBy");

-- CreateIndex
CREATE INDEX "AutomationExecution_automationType_automationId_idx" ON "AutomationExecution"("automationType", "automationId");

-- CreateIndex
CREATE INDEX "AutomationExecution_status_idx" ON "AutomationExecution"("status");

-- CreateIndex
CREATE INDEX "AutomationExecution_executedAt_idx" ON "AutomationExecution"("executedAt");

-- CreateIndex
CREATE INDEX "AutomationExecution_entityType_entityId_idx" ON "AutomationExecution"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "AutomationWebhook" ADD CONSTRAINT "AutomationWebhook_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationWebhook" ADD CONSTRAINT "AutomationWebhook_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
