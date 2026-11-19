
export const VALID_LEAVE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

export const VALID_ROLES = ["EMPLOYEE", "ADMIN"];

export function isValidUUID(value) {
  // Prisma IDs in this project use cuid(), not UUID.
  // Do not use this function to validate Prisma record IDs.
  return typeof value === "string" && value.trim().length > 0;
}

export function validateEmail(email) {
  if (!email || typeof email !== "string" || !email.trim()) {
    return { isValid: false, error: "Email address is required." };
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return {
    isValid: valid,
    error: valid ? null : "Please provide a valid email address.",
  };
}

export function validatePassword(password, minLength = 6) {
  if (typeof password !== "string" || password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters long.`,
    };
  }

  return { isValid: true, error: null };
}

export function validateDate(dateString, fieldName = "Date") {
  if (!dateString) {
    return { isValid: false, date: null, error: `${fieldName} is required.` };
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      date: null,
      error: `${fieldName} must be a valid date.`,
    };
  }

  return { isValid: true, date, error: null };
}

export function isPastDate(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

export function calculateLeaveDays(startDate, endDate, includeWeekends = true) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) return 0;

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();

    if (includeWeekends || (day !== 0 && day !== 6)) {
      count += 1;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function validateDateRange(
  startDateString,
  endDateString,
  includeWeekends = true
) {
  const startCheck = validateDate(startDateString, "Start date");
  if (!startCheck.isValid) {
    return {
      isValid: false,
      startDate: null,
      endDate: null,
      totalDays: 0,
      error: startCheck.error,
    };
  }

  const endCheck = validateDate(endDateString, "End date");
  if (!endCheck.isValid) {
    return {
      isValid: false,
      startDate: null,
      endDate: null,
      totalDays: 0,
      error: endCheck.error,
    };
  }

  if (endCheck.date < startCheck.date) {
    return {
      isValid: false,
      startDate: null,
      endDate: null,
      totalDays: 0,
      error: "End date cannot be earlier than start date.",
    };
  }

  return {
    isValid: true,
    startDate: startCheck.date,
    endDate: endCheck.date,
    totalDays: calculateLeaveDays(
      startCheck.date,
      endCheck.date,
      includeWeekends
    ),
    error: null,
  };
}
