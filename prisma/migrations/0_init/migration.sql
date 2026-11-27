-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdminRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "annualQuota" INTEGER NOT NULL DEFAULT 0,
    "quarterlyQuota" INTEGER NOT NULL DEFAULT 0,
    "carryForwardAllowed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "casualLeave" INTEGER NOT NULL DEFAULT 0,
    "sickLeave" INTEGER NOT NULL DEFAULT 0,
    "workFromHome" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarterly_entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "allocatedDays" INTEGER NOT NULL,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "reservedDays" INTEGER NOT NULL DEFAULT 0,
    "carryInDays" INTEGER NOT NULL DEFAULT 0,
    "carryOutDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarterly_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request_allocations" (
    "id" TEXT NOT NULL,
    "leaveApplicationId" TEXT NOT NULL,
    "quarterlyEntitlementId" TEXT NOT NULL,
    "allocatedDays" INTEGER NOT NULL,

    CONSTRAINT "leave_request_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_code_counters" (
    "role" "UserRole" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "employee_code_counters_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_registration_requests" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" "AdminRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_code_key" ON "leave_types"("code");

-- CreateIndex
CREATE INDEX "leave_applications_userId_idx" ON "leave_applications"("userId");

-- CreateIndex
CREATE INDEX "leave_applications_status_idx" ON "leave_applications"("status");

-- CreateIndex
CREATE INDEX "leave_applications_leaveTypeId_idx" ON "leave_applications"("leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_applications_userId_startDate_endDate_idx" ON "leave_applications"("userId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userId_key" ON "leave_balances"("userId");

-- CreateIndex
CREATE INDEX "quarterly_entitlements_userId_year_quarter_idx" ON "quarterly_entitlements"("userId", "year", "quarter");

-- CreateIndex
CREATE INDEX "quarterly_entitlements_leaveTypeId_idx" ON "quarterly_entitlements"("leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "quarterly_entitlements_userId_year_quarter_leaveTypeId_key" ON "quarterly_entitlements"("userId", "year", "quarter", "leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_request_allocations_quarterlyEntitlementId_idx" ON "leave_request_allocations"("quarterlyEntitlementId");

-- CreateIndex
CREATE UNIQUE INDEX "leave_request_allocations_leaveApplicationId_quarterlyEntit_key" ON "leave_request_allocations"("leaveApplicationId", "quarterlyEntitlementId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_registration_requests_email_key" ON "admin_registration_requests"("email");

-- CreateIndex
CREATE INDEX "admin_registration_requests_status_idx" ON "admin_registration_requests"("status");

-- CreateIndex
CREATE INDEX "public_holidays_date_idx" ON "public_holidays"("date");

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_entitlements" ADD CONSTRAINT "quarterly_entitlements_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quarterly_entitlements" ADD CONSTRAINT "quarterly_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request_allocations" ADD CONSTRAINT "leave_request_allocations_leaveApplicationId_fkey" FOREIGN KEY ("leaveApplicationId") REFERENCES "leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_request_allocations" ADD CONSTRAINT "leave_request_allocations_quarterlyEntitlementId_fkey" FOREIGN KEY ("quarterlyEntitlementId") REFERENCES "quarterly_entitlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
