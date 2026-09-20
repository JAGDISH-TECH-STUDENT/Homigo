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

async function sendPasswordResetEmail({ recipient, resetUrl }) {
    const transporter = createTransporter();
    const configuredFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
    const fromMatch = configuredFrom.match(/^(.*?)\s*<([^>]+)>$/);
    const from = fromMatch
        ? { name: fromMatch[1].trim() || "Homigo", address: fromMatch[2].trim() }
        : configuredFrom.trim();

    return transporter.sendMail({
        from,
        replyTo: from,
        to: recipient,
        subject: "Reset your Homigo password",
        text: `Use this link to reset your Homigo password. It expires in 15 minutes: ${resetUrl}`,
        html: `<p>Use the button below to reset your Homigo password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 15 minutes.</p>`
    });
}

module.exports = { sendPasswordResetEmail };
