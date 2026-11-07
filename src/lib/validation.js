/**
 * Reusable input validation utilities for ELMS
 */

// Supported Leave Types matching Prisma enum
export const VALID_LEAVE_TYPES = ["CASUAL", "SICK", "EARNED"];

// Supported Leave Statuses matching Prisma enum
export const VALID_LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

// Supported Roles matching Prisma enum
export const VALID_ROLES = ["EMPLOYEE", "ADMIN"];

/**
 * Validates whether a string is a standard UUID
 * @param {string} uuid
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

/**
 * 1. Reusable Email Validation
 * Checks format, presence, and valid email pattern
 * @param {string} email
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { isValid: false, error: "Email address is required." };
  }

  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please provide a valid email address." };
  }

  return { isValid: true, error: null };
}

/**
 * 2. Reusable Password Validation
 * Validates length and type for user passwords
 * @param {string} password
 * @param {number} [minLength=6]
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validatePassword(password, minLength = 6) {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * 3. Reusable Single Date Validation
 * Ensures input is a parseable date string
 * @param {string} dateString
 * @param {string} [fieldName="Date"]
 * @returns {{ isValid: boolean, date: Date|null, error: string|null }}
 */
export function validateDate(dateString, fieldName = "Date") {
  if (!dateString) {
    return { isValid: false, date: null, error: `${fieldName} is required.` };
  }

  const parsedDate = new Date(dateString);

  if (isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      date: null,
      error: `${fieldName} must be a valid date format (e.g. YYYY-MM-DD).`,
    };
  }

  return { isValid: true, date: parsedDate, error: null };
}

/**
 * Checks if a given date is strictly in the past (before today's midnight)
 * @param {Date|string} dateInput
 * @returns {boolean} True if date is before today
 */
export function isPastDate(dateInput) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkDate = new Date(dateInput);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate < today;
}

/**
 * Calculate total leave days
 * - By default: counts all inclusive calendar days
 * - Optionally can exclude weekends (Saturdays and Sundays) for working-day calculations
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {boolean} [includeWeekends=true]
 * @returns {number}
 */
export function calculateLeaveDays(startDate, endDate, includeWeekends = true) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) return 0;

  if (includeWeekends) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay(); // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Reusable Date Range Validation for Leave Applications
 * Checks both start and end dates and verifies that end date is on or after start date
 * @param {string} startDateString
 * @param {string} endDateString
 * @param {boolean} [includeWeekends=true]
 * @returns {{ isValid: boolean, startDate: Date|null, endDate: Date|null, totalDays: number, error: string|null }}
 */
export function validateDateRange(startDateString, endDateString, includeWeekends = true) {
  const startCheck = validateDate(startDateString, "Start date");
  if (!startCheck.isValid) {
    return { isValid: false, startDate: null, endDate: null, totalDays: 0, error: startCheck.error };
  }

  const endCheck = validateDate(endDateString, "End date");
  if (!endCheck.isValid) {
    return { isValid: false, startDate: null, endDate: null, totalDays: 0, error: endCheck.error };
  }

  const start = startCheck.date;
  const end = endCheck.date;

  if (end < start) {
    return {
      isValid: false,
      startDate: null,
      endDate: null,
      totalDays: 0,
      error: "End date cannot be earlier than start date.",
    };
  }

  const diffDays = calculateLeaveDays(start, end, includeWeekends);

  return {
    isValid: true,
    startDate: start,
    endDate: end,
    totalDays: diffDays,
    error: null,
  };
}

/**
 * 4. Reusable Leave Type Validation
 * Ensures leave type matches one of CASUAL, SICK, or EARNED
 * @param {string} leaveType
 * @returns {{ isValid: boolean, error: string|null }}
 */
export function validateLeaveType(leaveType) {
  if (!leaveType || typeof leaveType !== "string") {
    return {
      isValid: false,
      error: `Leave type is required. Must be one of: ${VALID_LEAVE_TYPES.join(", ")}.`,
    };
  }

  const upperType = leaveType.trim().toUpperCase();

  if (!VALID_LEAVE_TYPES.includes(upperType)) {
    return {
      isValid: false,
      error: `Invalid leave type "${leaveType}". Allowed types are: ${VALID_LEAVE_TYPES.join(", ")}.`,
    };
  }

  return { isValid: true, error: null };
}
