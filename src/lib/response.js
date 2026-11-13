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

/**
 * Standardized 405 Method Not Allowed JSON response helper
 * Prevents empty 405 browser crashes and provides actionable developer instructions
 * @param {string[]} allowedMethods - Array of allowed HTTP methods (e.g. ['POST'])
 * @param {string} [customMessage] - Optional custom message
 */
export function methodNotAllowedResponse(allowedMethods = ["POST"], customMessage = null) {
  const message =
    customMessage ||
    `HTTP 405 Method Not Allowed. This endpoint only accepts [${allowedMethods.join(
      ", "
    )}]. Browsers perform GET requests by default when opening URLs in the address bar. Please use the appropriate HTTP method (${allowedMethods.join(
      ", "
    )}) via an API client (like Postman), a form submission, or fetch/curl.`;

  return Response.json(
    {
      success: false,
      statusCode: 405,
      message,
      allowedMethods,
    },
    {
      status: 405,
      headers: {
        Allow: allowedMethods.join(", "),
        "Content-Type": "application/json",
      },
    }
  );
}
