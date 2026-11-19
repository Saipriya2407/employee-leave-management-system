-- CreateTable: WFH Requests
CREATE TABLE "wfh_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "adminRemarks" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wfh_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Quarterly Entitlements
CREATE TABLE "quarterly_entitlements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "casualAllocated" INTEGER NOT NULL DEFAULT 3,
    "sickAllocated" INTEGER NOT NULL DEFAULT 3,
    "wfhAllocated" INTEGER NOT NULL DEFAULT 3,
    "sickCarryIn" INTEGER NOT NULL DEFAULT 0,
    "sickCarryOut" INTEGER NOT NULL DEFAULT 0,
    "casualUsed" INTEGER NOT NULL DEFAULT 0,
    "sickUsed" INTEGER NOT NULL DEFAULT 0,
    "wfhUsed" INTEGER NOT NULL DEFAULT 0,
    "casualReserved" INTEGER NOT NULL DEFAULT 0,
    "sickReserved" INTEGER NOT NULL DEFAULT 0,
    "wfhReserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quarterly_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Leave Request Allocations (Cross-quarter)
CREATE TABLE "leave_request_allocations" (
    "id" TEXT NOT NULL,
    "leaveApplicationId" TEXT NOT NULL,
    "quarterlyEntitlementId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "allocatedDays" INTEGER NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WFH Request Allocations (Cross-quarter)
CREATE TABLE "wfh_request_allocations" (
    "id" TEXT NOT NULL,
    "wfhRequestId" TEXT NOT NULL,
    "quarterlyEntitlementId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "allocatedDays" INTEGER NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wfh_request_allocations_pkey" PRIMARY KEY ("id")
);

-- Indexes and Constraints for WFH Requests
CREATE INDEX "wfh_requests_userId_status_idx" ON "wfh_requests"("userId", "status");
CREATE INDEX "wfh_requests_startDate_endDate_idx" ON "wfh_requests"("startDate", "endDate");

-- Indexes and Constraints for Quarterly Entitlements
CREATE INDEX "quarterly_entitlements_userId_year_idx" ON "quarterly_entitlements"("userId", "year");
CREATE UNIQUE INDEX "quarterly_entitlements_userId_year_quarter_key" ON "quarterly_entitlements"("userId", "year", "quarter");

-- Indexes and Constraints for Leave Allocations
CREATE INDEX "leave_request_allocations_quarterlyEntitlementId_idx" ON "leave_request_allocations"("quarterlyEntitlementId");
CREATE INDEX "leave_request_allocations_year_quarter_idx" ON "leave_request_allocations"("year", "quarter");
CREATE UNIQUE INDEX "leave_request_allocations_leaveApplicationId_year_quarter_key" ON "leave_request_allocations"("leaveApplicationId", "year", "quarter");

-- Indexes and Constraints for WFH Allocations
CREATE INDEX "wfh_request_allocations_quarterlyEntitlementId_idx" ON "wfh_request_allocations"("quarterlyEntitlementId");
CREATE INDEX "wfh_request_allocations_year_quarter_idx" ON "wfh_request_allocations"("year", "quarter");
CREATE UNIQUE INDEX "wfh_request_allocations_wfhRequestId_year_quarter_key" ON "wfh_request_allocations"("wfhRequestId", "year", "quarter");

-- Foreign Keys
ALTER TABLE "wfh_requests" ADD CONSTRAINT "wfh_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quarterly_entitlements" ADD CONSTRAINT "quarterly_entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_request_allocations" ADD CONSTRAINT "leave_request_allocations_leaveApplicationId_fkey" FOREIGN KEY ("leaveApplicationId") REFERENCES "leave_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_request_allocations" ADD CONSTRAINT "leave_request_allocations_quarterlyEntitlementId_fkey" FOREIGN KEY ("quarterlyEntitlementId") REFERENCES "quarterly_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wfh_request_allocations" ADD CONSTRAINT "wfh_request_allocations_wfhRequestId_fkey" FOREIGN KEY ("wfhRequestId") REFERENCES "wfh_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wfh_request_allocations" ADD CONSTRAINT "wfh_request_allocations_quarterlyEntitlementId_fkey" FOREIGN KEY ("quarterlyEntitlementId") REFERENCES "quarterly_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
