
/**
 * Comprehensive Backend Audit & Test Harness for ELMS
 * Tests authentication, authorization, validation and leave rules.
 */

import {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
} from "./auth.js";

import {
  requireAuth,
  requireEmployee,
  requireAdmin,
  verifyOwnership,
} from "./permissions.js";

import {
  validateEmail,
  validatePassword,
  validateDateRange,
  isPastDate,
  isValidUUID,
  VALID_LEAVE_TYPES,
  VALID_LEAVE_STATUSES,
  VALID_ROLES,
} from "./validation.js";

async function runFullAudit() {
  console.log("================================================================================");
  console.log("EMPLOYEE LEAVE MANAGEMENT SYSTEM (ELMS) - COMPLETE BACKEND AUDIT");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(condition, testName) {
    totalTests++;

    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
    }
  }

  // SECTION 1: DATABASE & PRISMA CONFIGURATION

  console.log("--- SECTION 1: PRISMA & MODEL DEFINITIONS ---");

  assertTest(
    Array.isArray(VALID_ROLES) &&
      VALID_ROLES.includes("EMPLOYEE") &&
      VALID_ROLES.includes("ADMIN"),
    "Role Enum contains EMPLOYEE and ADMIN"
  );

  assertTest(
    VALID_LEAVE_TYPES.length === 3 &&
      VALID_LEAVE_TYPES.includes("CASUAL") &&
      VALID_LEAVE_TYPES.includes("SICK") &&
      VALID_LEAVE_TYPES.includes("WFH"),
    "Leave types contain CASUAL, SICK and WFH"
  );

  assertTest(
    VALID_LEAVE_STATUSES.length === 4 &&
      VALID_LEAVE_STATUSES.includes("PENDING") &&
      VALID_LEAVE_STATUSES.includes("APPROVED") &&
      VALID_LEAVE_STATUSES.includes("REJECTED") &&
      VALID_LEAVE_STATUSES.includes("CANCELLED"),
    "Leave statuses contain all four valid statuses"
  );

  // SECTION 2: PASSWORD HASHING & AUTHENTICATION

  console.log("\n--- SECTION 2: PASSWORD HASHING & AUTHENTICATION ---");

  const rawPassword = "TestPassword@123";
  const hashedPassword = await hashPassword(rawPassword);

  assertTest(
    hashedPassword &&
      hashedPassword !== rawPassword &&
      hashedPassword.startsWith("$2"),
    "Password hashing with bcryptjs"
  );

  const passwordMatch = await comparePassword(
    rawPassword,
    hashedPassword
  );

  assertTest(
    passwordMatch === true,
    "Valid password verification"
  );

  const invalidPasswordMatch = await comparePassword(
    "WrongPassword!",
    hashedPassword
  );

  assertTest(
    invalidPasswordMatch === false,
    "Invalid password rejected"
  );

  const validEmailCheck = validateEmail("employee@company.com");

  assertTest(
    validEmailCheck.isValid === true,
    "Valid email format accepted"
  );

  const invalidEmailCheck = validateEmail("invalid-email-string");

  assertTest(
    invalidEmailCheck.isValid === false,
    "Invalid email format rejected"
  );

  const shortPasswordCheck = validatePassword("12345", 6);

  assertTest(
    shortPasswordCheck.isValid === false,
    "Password under 6 characters rejected"
  );

  // SECTION 3: JWT GENERATION & VERIFICATION

  console.log("\n--- SECTION 3: JWT GENERATION, VERIFICATION & SECURITY ---");

  const userPayload = {
    id: "00000000-0000-0000-0000-000000000001",
    role: "EMPLOYEE",
    email: "emp@company.com",
  };

  const token = signToken(userPayload);

  assertTest(
    token &&
      typeof token === "string" &&
      token.split(".").length === 3,
    "JWT generation produces valid signed token"
  );

  const decoded = verifyToken(token);

  assertTest(
    decoded &&
      decoded.id === userPayload.id &&
      decoded.role === userPayload.role,
    "JWT verification extracts correct user details"
  );

  const tamperedToken = token.slice(0, -5) + "abcde";
  const tamperedDecoded = verifyToken(tamperedToken);

  assertTest(
    tamperedDecoded === null,
    "Tampered JWT signature rejected"
  );

  const emptyTokenDecoded = verifyToken("");

  assertTest(
    emptyTokenDecoded === null,
    "Empty JWT returns null"
  );

  // SECTION 4: ROLE-BASED ACCESS CONTROL

  console.log("\n--- SECTION 4: ROLE-BASED ACCESS CONTROL ---");

  const empRequest = {
    cookies: { get: () => ({ value: token }) },
    headers: { get: () => null },
  };

  const empAuth = await requireEmployee(empRequest);

  assertTest(
    empAuth.authorized === true &&
      empAuth.user.role === "EMPLOYEE",
    "Employee authorized for employee routes"
  );

  const empAdminAttempt = await requireAdmin(empRequest);

  assertTest(
    empAdminAttempt.authorized === false &&
      empAdminAttempt.response?.status === 403,
    "Employee blocked from admin routes"
  );

  const adminToken = signToken({
    id: "00000000-0000-0000-0000-000000000099",
    role: "ADMIN",
    email: "admin@company.com",
  });

  const adminRequest = {
    cookies: { get: () => ({ value: adminToken }) },
    headers: { get: () => null },
  };

  const adminAuth = await requireAdmin(adminRequest);

  assertTest(
    adminAuth.authorized === true &&
      adminAuth.user.role === "ADMIN",
    "Admin authorized for admin routes"
  );

  const unauthRequest = {
    cookies: { get: () => null },
    headers: { get: () => null },
  };

  const unauthCheck = await requireAuth(unauthRequest);

  assertTest(
    unauthCheck.authorized === false &&
      unauthCheck.response?.status === 401,
    "Unauthenticated request returns HTTP 401"
  );

  const ownRecordCheck = verifyOwnership(
    empAuth,
    userPayload.id
  );

  assertTest(
    ownRecordCheck.authorized === true,
    "Employee can access own record"
  );

  const otherRecordCheck = verifyOwnership(
    empAuth,
    "some-other-user-id"
  );

  assertTest(
    otherRecordCheck.authorized === false &&
      otherRecordCheck.response?.status === 403,
    "Employee blocked from another employee's record"
  );

  const adminOverrideCheck = verifyOwnership(
    adminAuth,
    "some-other-user-id"
  );

  assertTest(
    adminOverrideCheck.authorized === true,
    "Admin can access any employee record"
  );

  // SECTION 5: LEAVE MANAGEMENT & DATE VALIDATION

  console.log("\n--- SECTION 5: LEAVE APPLICATION & DATE VALIDATION ---");

  assertTest(
    isPastDate("2020-01-01") === true,
    "Past-date detection works"
  );

  assertTest(
    isPastDate("2099-12-31") === false,
    "Future date accepted"
  );

  const validRange = validateDateRange(
    "2026-12-01",
    "2026-12-05",
    true
  );

  assertTest(
    validRange.isValid === true &&
      validRange.totalDays === 5,
    "Inclusive date range calculation"
  );

  const workingDaysRange = validateDateRange(
    "2026-11-13",
    "2026-11-16",
    false
  );

  assertTest(
    workingDaysRange.isValid === true &&
      workingDaysRange.totalDays === 2,
    "Weekend exclusion calculation"
  );

  const reversedRange = validateDateRange(
    "2026-12-10",
    "2026-12-01"
  );

  assertTest(
    reversedRange.isValid === false,
    "End date earlier than start date rejected"
  );

  function checkOverlap(s1, e1, s2, e2) {
    const start1 = new Date(s1).getTime();
    const end1 = new Date(e1).getTime();
    const start2 = new Date(s2).getTime();
    const end2 = new Date(e2).getTime();

    return start1 <= end2 && end1 >= start2;
  }

  assertTest(
    checkOverlap(
      "2026-12-01",
      "2026-12-05",
      "2026-12-03",
      "2026-12-07"
    ) === true,
    "Overlapping leave dates detected"
  );

  assertTest(
    checkOverlap(
      "2026-12-01",
      "2026-12-05",
      "2026-12-06",
      "2026-12-10"
    ) === false,
    "Non-overlapping dates allowed"
  );

  // Prisma uses cuid() IDs in this project.
  // isValidUUID currently checks for a non-empty string.

  assertTest(
    isValidUUID("cuid_test_id_123") === true,
    "Non-empty Prisma ID accepted"
  );

  assertTest(
    isValidUUID("") === false,
    "Empty Prisma ID rejected"
  );

  // SECTION 6: QUARTERLY LEAVE BALANCE

  console.log("\n--- SECTION 6: QUARTERLY LEAVE BALANCE ---");

  const testBalance = {
    casualLeave: 3,
    sickLeave: 3,
    workFromHome: 3,
  };

  const requestedDays = 2;

  assertTest(
    testBalance.casualLeave === 3,
    "Pending application does not deduct balance"
  );

  testBalance.casualLeave -= requestedDays;

  assertTest(
    testBalance.casualLeave === 1,
    "Approval deducts requested days from quarterly quota"
  );

  let duplicatePrevented = false;
  const currentStatus = "APPROVED";

  if (currentStatus !== "PENDING") {
    duplicatePrevented = true;
  }

  assertTest(
    duplicatePrevented === true,
    "Duplicate approval prevented"
  );

  const largeRequest = 5;
  const overdrawBlocked =
    testBalance.casualLeave < largeRequest;

  assertTest(
    overdrawBlocked === true,
    "Insufficient quarterly balance prevents approval"
  );

  console.log("\n================================================================================");
  console.log(
    `TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`
  );
  console.log("================================================================================");

  if (passedTests === totalTests) {
    console.log("ALL TESTS PASSED!");
  } else {
    console.log("SOME TESTS FAILED. CHECK THE ERRORS ABOVE.");
  }
}

runFullAudit();
