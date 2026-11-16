
export async function sendPasswordResetEmail(email, resetUrl) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey || !fromEmail) {
    throw new Error("Brevo email configuration is missing.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "ELMS",
        email: fromEmail,
      },
      to: [{ email }],
      subject: "Reset Your ELMS Password",
      htmlContent: `
        <h2>ELMS Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetUrl}">Reset Your Password</a>
        </p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      `,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Brevo email error:", result);
    throw new Error("Unable to send password reset email.");
  }

  return result;
}
