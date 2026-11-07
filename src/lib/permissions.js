import { getAuthUser } from "./auth.js";
import { errorResponse } from "./response.js";

/**
 * 1. Require Authenticated User
 * Ensures the incoming request has a valid, non-expired JWT session
 * @param {Request} request
 * @returns {Promise<{ authorized: boolean, user: object|null, response: Response|null }>}
 */
export async function requireAuth(request) {
  const user = await getAuthUser(request);

  if (!user) {
    return {
      authorized: false,
      user: null,
      response: errorResponse("Unauthorized: Invalid, expired, or missing session token. Please log in.", 401),
    };
  }

  return {
    authorized: true,
    user,
    response: null,
  };
}

/**
 * 2. Require Admin Role
 * Ensures user is authenticated AND holds the ADMIN role.
 * Non-admins and employees receive HTTP 403 Forbidden.
 * @param {Request} request
 * @returns {Promise<{ authorized: boolean, user: object|null, response: Response|null }>}
 */
export async function requireAdmin(request) {
  const auth = await requireAuth(request);

  if (!auth.authorized) {
    return auth;
  }

  if (auth.user.role !== "ADMIN") {
    return {
      authorized: false,
      user: null,
      response: errorResponse("Forbidden: Administrator privileges required.", 403),
    };
  }

  return auth;
}

/**
 * 3. Require Employee Role
 * Ensures user is authenticated AND holds an EMPLOYEE or ADMIN role.
 * @param {Request} request
 * @returns {Promise<{ authorized: boolean, user: object|null, response: Response|null }>}
 */
export async function requireEmployee(request) {
  const auth = await requireAuth(request);

  if (!auth.authorized) {
    return auth;
  }

  if (auth.user.role !== "EMPLOYEE" && auth.user.role !== "ADMIN") {
    return {
      authorized: false,
      user: null,
      response: errorResponse("Forbidden: Employee account required.", 403),
    };
  }

  return auth;
}

/**
 * 4. Verify Ownership or Admin Override
 * Validates that an employee can ONLY access/modify their own records,
 * while granting full access to administrators.
 * Prevents Insecure Direct Object References (IDOR).
 * @param {object} auth - Result from requireAuth() containing verified user
 * @param {string} resourceOwnerId - Target record's owner userId
 * @returns {{ authorized: boolean, response: Response|null }}
 */
export function verifyOwnership(auth, resourceOwnerId) {
  if (!auth.authorized || !auth.user) {
    return {
      authorized: false,
      response: errorResponse("Unauthorized: Please log in to continue.", 401),
    };
  }

  // Admins bypass ownership check
  if (auth.user.role === "ADMIN") {
    return { authorized: true, response: null };
  }

  // Employees can ONLY access their own records
  if (auth.user.id !== resourceOwnerId) {
    return {
      authorized: false,
      response: errorResponse("Forbidden: You do not have permission to access or modify this record.", 403),
    };
  }

  return { authorized: true, response: null };
}
