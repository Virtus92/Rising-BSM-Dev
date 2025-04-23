-- AlterTable
ALTER TABLE "ContactRequest" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "source" VARCHAR(50);

-- CreateTable
CREATE TABLE "RequestData" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "dataType" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "processedBy" VARCHAR(50),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "RequestData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestDataHistory" (
    "id" SERIAL NOT NULL,
    "requestDataId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "changedBy" VARCHAR(100),
    "changeReason" TEXT,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "RequestDataHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8NWebhook" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "url" VARCHAR(255) NOT NULL,
    "workflowId" VARCHAR(100),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "category" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "N8NWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestData_requestId_idx" ON "RequestData"("requestId");

-- CreateIndex
CREATE INDEX "RequestData_category_idx" ON "RequestData"("category");

-- CreateIndex
CREATE INDEX "RequestData_createdById_idx" ON "RequestData"("createdById");

-- CreateIndex
CREATE INDEX "RequestDataHistory_requestDataId_idx" ON "RequestDataHistory"("requestDataId");

-- CreateIndex
CREATE INDEX "RequestDataHistory_userId_idx" ON "RequestDataHistory"("userId");

-- CreateIndex
CREATE INDEX "N8NWebhook_category_idx" ON "N8NWebhook"("category");

-- CreateIndex
CREATE INDEX "N8NWebhook_active_idx" ON "N8NWebhook"("active");

-- CreateIndex
CREATE INDEX "ContactRequest_source_idx" ON "ContactRequest"("source");

-- AddForeignKey
ALTER TABLE "RequestData" ADD CONSTRAINT "RequestData_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestData" ADD CONSTRAINT "RequestData_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDataHistory" ADD CONSTRAINT "RequestDataHistory_requestDataId_fkey" FOREIGN KEY ("requestDataId") REFERENCES "RequestData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestDataHistory" ADD CONSTRAINT "RequestDataHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
