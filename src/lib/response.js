/**
 * Standardized success JSON response helper
 * Uses Web Standard Response.json() fully compatible with Next.js App Router
 * @param {*} data - Payload to return to client
 * @param {string} message - Human-readable success message
 * @param {number} status - HTTP status code (default: 200)
 */
export function successResponse(data = null, message = "Success", status = 200) {
  return Response.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Standardized error JSON response helper
 * Uses Web Standard Response.json() fully compatible with Next.js App Router
 * @param {string} message - Human-readable error description
 * @param {number} status - HTTP status code (default: 400)
 * @param {*} errors - Optional detailed validation or field errors
 */
export function errorResponse(message = "An error occurred", status = 400, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return Response.json(body, { status });
}
