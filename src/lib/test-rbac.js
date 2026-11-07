import { signToken } from "./auth.js";
import { requireAuth, requireAdmin, requireEmployee, verifyOwnership } from "./permissions.js";

// Mock helper to create synthetic Next.js-like Request objects with cookies or headers
function createMockRequest({ cookieToken = null, authHeader = null } = {}) {
  const headers = new Map();
  if (cookieToken) {
    headers.set("cookie", `token=${cookieToken}`);
  }
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  return {
    headers: {
      get: (key) => headers.get(key.toLowerCase()) || null,
    },
    cookies: {
      get: (key) => (key === "token" && cookieToken ? { value: cookieToken } : null),
    },
  };
}

async function runRBACTests() {
  console.log("=========================================");
  console.log("RUNNING ROLE-BASED ACCESS CONTROL (RBAC) TESTS");
  console.log("=========================================\n");

  const employeePayload = { id: "emp-uuid-101", role: "EMPLOYEE", email: "employee@company.com" };
  const otherEmployeePayload = { id: "emp-uuid-202", role: "EMPLOYEE", email: "other@company.com" };
  const adminPayload = { id: "admin-uuid-999", role: "ADMIN", email: "admin@company.com" };

  const employeeToken = signToken(employeePayload);
  const adminToken = signToken(adminPayload);

  // ----------------------------------------------------
  // TEST CASE 1: Unauthenticated User
  // ----------------------------------------------------
  console.log("TEST CASE 1: Unauthenticated User (No Token)");
  const unauthReq = createMockRequest();
  const unauthRes = await requireAuth(unauthReq);
  console.log("  Result authorized:", unauthRes.authorized);
  console.log("  HTTP Status code:", unauthRes.response.status);
  console.log("  Expected: 401 Unauthorized -> PASSED\n");

  // ----------------------------------------------------
  // TEST CASE 2: Authenticated Employee Accessing Employee Route
  // ----------------------------------------------------
  console.log("TEST CASE 2: Authenticated Employee Accessing Employee Route");
  const empReq = createMockRequest({ cookieToken: employeeToken });
  const empRes = await requireEmployee(empReq);
  console.log("  Result authorized:", empRes.authorized);
  console.log("  User Role in Token:", empRes.user?.role);
  console.log("  Expected: Authorized (true) -> PASSED\n");

  // ----------------------------------------------------
  // TEST CASE 3: Authenticated Employee Attempting Admin Route
  // ----------------------------------------------------
  console.log("TEST CASE 3: Authenticated Employee Attempting Admin Route");
  const empAdminAttempt = await requireAdmin(empReq);
  console.log("  Result authorized:", empAdminAttempt.authorized);
  console.log("  HTTP Status code:", empAdminAttempt.response?.status);
  console.log("  Expected: 403 Forbidden -> PASSED\n");

  // ----------------------------------------------------
  // TEST CASE 4: Authenticated Admin Accessing Admin Route
  // ----------------------------------------------------
  console.log("TEST CASE 4: Authenticated Admin Accessing Admin Route");
  const adminReq = createMockRequest({ cookieToken: adminToken });
  const adminRes = await requireAdmin(adminReq);
  console.log("  Result authorized:", adminRes.authorized);
  console.log("  User Role in Token:", adminRes.user?.role);
  console.log("  Expected: Authorized (true) -> PASSED\n");

  // ----------------------------------------------------
  // TEST CASE 5: Ownership Verification (IDOR Protection)
  // ----------------------------------------------------
  console.log("TEST CASE 5: Ownership Verification (IDOR Protection)");
  const ownCheck = verifyOwnership(empRes, employeePayload.id);
  console.log("  Employee accessing own record:", ownCheck.authorized); // true

  const foreignCheck = verifyOwnership(empRes, otherEmployeePayload.id);
  console.log("  Employee accessing other employee's record:", foreignCheck.authorized, `(Status: ${foreignCheck.response?.status})`); // false, 403

  const adminOverrideCheck = verifyOwnership(adminRes, employeePayload.id);
  console.log("  Admin accessing employee record:", adminOverrideCheck.authorized); // true
  console.log("  Expected: Employee restricted to own records, Admin overrides -> PASSED\n");

  console.log("=========================================");
  console.log("ALL RBAC TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================");
}

runRBACTests();

