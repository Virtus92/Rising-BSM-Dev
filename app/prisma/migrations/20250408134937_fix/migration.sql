-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'employee',
    "phone" VARCHAR(30),
    "status" TEXT NOT NULL DEFAULT 'active',
    "profilePicture" VARCHAR(255),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "language" VARCHAR(10) NOT NULL DEFAULT 'de',
    "notificationInterval" VARCHAR(20) NOT NULL DEFAULT 'immediate',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "activity" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "ipAddress" VARCHAR(255),

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "sid" VARCHAR NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByIp" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedByIp" TEXT,
    "replacedByToken" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "company" VARCHAR(100),
    "email" VARCHAR(100),
    "phone" VARCHAR(30),
    "address" TEXT,
    "postalCode" VARCHAR(10),
    "city" VARCHAR(100),
    "country" VARCHAR(100) NOT NULL DEFAULT 'Deutschland',
    "notes" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "type" VARCHAR(20) NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLog" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "userId" INTEGER,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "customerId" INTEGER,
    "appointmentDate" TIMESTAMP(6) NOT NULL,
    "duration" INTEGER,
    "location" VARCHAR(200),
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'planned',
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentNote" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" VARCHAR(100) NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentLog" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "service" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'new',
    "processorId" INTEGER,
    "customerId" INTEGER,
    "appointmentId" INTEGER,
    "ipAddress" VARCHAR(255),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestNote" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" VARCHAR(100) NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" VARCHAR(255) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "referenceId" INTEGER,
    "referenceType" VARCHAR(50),
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "message" TEXT,
    "description" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_email_idx" ON "ContactRequest"("email");

-- CreateIndex
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLog" ADD CONSTRAINT "CustomerLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLog" ADD CONSTRAINT "CustomerLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNote" ADD CONSTRAINT "AppointmentNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNote" ADD CONSTRAINT "AppointmentNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentLog" ADD CONSTRAINT "AppointmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactRequest" ADD CONSTRAINT "ContactRequest_processorId_fkey" FOREIGN KEY ("processorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestNote" ADD CONSTRAINT "RequestNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestNote" ADD CONSTRAINT "RequestNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
