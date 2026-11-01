const nodemailer = require("nodemailer");

function createTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("SMTP email configuration is missing");
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
}

async function sendPasswordResetEmail({ recipient, resetUrl, username }) {
    const transporter = createTransporter();
    const configuredFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
    const fromMatch = configuredFrom.match(/^(.*?)\s*<([^>]+)>$/);
    const from = fromMatch
        ? { name: fromMatch[1].trim() || "Homigo", address: fromMatch[2].trim() }
        : configuredFrom.trim();

    const name = username || "there";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Homigo Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f1a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f1a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0d121f; padding: 24px 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                <span style="color: #818cf8;">Homigo</span>
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #ffffff;">Password Reset Request</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #cbd5e1;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #94a3b8;">
                We received a request to reset your Homigo account password. Click the button below to choose a new password:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #6366f1, #4f46e5);">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #64748b;">
                ⏱️ <strong>This link will expire in 15 minutes.</strong>
              </p>
              <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0;" />
              <p style="margin: 0; font-size: 12px; line-height: 1.4; color: #475569;">
                If the button above doesn't work, copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color: #818cf8; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return transporter.sendMail({
        from,
        replyTo: from,
        to: recipient,
        subject: "Reset your Homigo password",
        text: `Hi ${name},\n\nUse this link to reset your Homigo password (expires in 15 minutes):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
        html: htmlContent
    });
}

module.exports = { sendPasswordResetEmail };
