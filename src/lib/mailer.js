
import { google } from "googleapis";

export async function sendPasswordResetEmail(email, resetUrl) {
  const {
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN,
    EMAIL_USER,
  } = process.env;

  if (
    !GMAIL_CLIENT_ID ||
    !GMAIL_CLIENT_SECRET ||
    !GMAIL_REFRESH_TOKEN ||
    !EMAIL_USER
  ) {
    throw new Error("Gmail API configuration is missing.");
  }

  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const subject = "Reset Your ELMS Password";

  const html = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your ELMS password.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset My Password</a>
    <p>This link expires in 15 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

  const message = [
    `From: ELMS <${EMAIL_USER}>`,
    `To: ${email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ].join("\r\n");

  const raw = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return result.data;
}
