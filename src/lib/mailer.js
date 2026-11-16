
export async function sendPasswordResetEmail(email, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey || !fromEmail) {
    throw new Error("Resend email configuration is missing.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: "Reset Your ELMS Password",
      text: `You requested a password reset.

Click this link to reset your password:
${resetUrl}

This link expires in 15 minutes. If you did not request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>ELMS Password Reset</h2>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetUrl}"
               style="background:#2563eb;color:white;padding:12px 20px;
               text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Resend email error:", result);
    throw new Error(result.message || "Unable to send password reset email.");
  }

  return result;
}
