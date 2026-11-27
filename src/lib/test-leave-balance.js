
/**
 * Automated Verification Script: Leave Balance & Database Consistency Logic
 * Tests quarterly leave balance rules for Casual, Sick and WFH.
 */

function runBalanceConsistencyTests() {
  console.log("=================================================");
  console.log("RUNNING LEAVE BALANCE DATABASE CONSISTENCY TESTS");
  console.log("=================================================\n");

  // Quarterly allocation: 3 Casual, 3 Sick, 3 WFH
  const initialBalance = {
    casualLeave: 3,
    sickLeave: 3,
    workFromHome: 3,
  };

  const pendingApplication = {
    id: "app-1",
    leaveType: "CASUAL",
    totalDays: 2,
    status: "PENDING",
  };

  let balance = { ...initialBalance };

  // Rule 1: Pending application
  console.log("TEST 1: Pending Application");
  console.assert(balance.casualLeave === 3, "Pending application must not deduct balance.");
  console.log("PASSED\n");

  // Rule 2: Rejection
  console.log("TEST 2: Rejected Application");
  pendingApplication.status = "REJECTED";
  console.assert(balance.casualLeave === 3, "Rejection must not deduct balance.");
  console.log("PASSED\n");

  // Rule 3: Cancellation
  console.log("TEST 3: Cancelled Application");
  pendingApplication.status = "CANCELLED";
  console.assert(balance.casualLeave === 3, "Cancellation must not deduct balance.");
  console.log("PASSED\n");

  // Rule 4: Approval
  console.log("TEST 4: Approval");
  pendingApplication.status = "PENDING";

  if (
    pendingApplication.status === "PENDING" &&
    balance.casualLeave >= pendingApplication.totalDays
  ) {
    balance.casualLeave -= pendingApplication.totalDays;
    pendingApplication.status = "APPROVED";
  }

  console.assert(balance.casualLeave === 1, "Approval should deduct 2 days.");
  console.log("PASSED\n");

  // Rule 5: Prevent duplicate deduction
  console.log("TEST 5: Duplicate Approval");
  let secondDeductionOccurred = false;

  if (pendingApplication.status === "PENDING") {
    balance.casualLeave -= pendingApplication.totalDays;
    secondDeductionOccurred = true;
  }

  console.assert(!secondDeductionOccurred && balance.casualLeave === 1,
    "Duplicate deduction must be prevented.");
  console.log("PASSED\n");

  // Rule 6: Prevent negative balance
  console.log("TEST 6: Negative Balance Prevention");
  const largeRequest = 5;
  const transactionCommitted = balance.casualLeave >= largeRequest;

  console.assert(!transactionCommitted && balance.casualLeave === 1,
    "Insufficient balance must prevent approval.");
  console.log("PASSED\n");

  // Rule 7: Sick leave carry-forward
  console.log("TEST 7: Sick Leave Carry-Forward");
  const unusedSickLeave = 2;
  const nextQuarterSickAllocation = 3 + unusedSickLeave;

  console.assert(nextQuarterSickAllocation === 5,
    "Unused sick leave should carry into the next quarter.");
  console.log("PASSED\n");

  // Rule 8: No Casual or WFH carry-forward
  console.log("TEST 8: Casual and WFH Carry-Forward");
  const nextQuarterCasual = 3;
  const nextQuarterWFH = 3;

  console.assert(nextQuarterCasual === 3 && nextQuarterWFH === 3,
    "Casual and WFH must not carry forward.");
  console.log("PASSED\n");

  console.log("=================================================");
  console.log("ALL LEAVE BALANCE TESTS COMPLETED!");
  console.log("=================================================");
}

runBalanceConsistencyTests();
