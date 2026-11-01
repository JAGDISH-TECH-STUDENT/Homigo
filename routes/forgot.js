const express = require("express");
const router = express.Router();
const User = require("../models/user");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/mailer");

const TOKEN_TTL_MS = 15 * 60 * 1000;

function maskEmail(email) {
  if (!email || !email.includes("@")) return email || "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

router.post("/", async (req, res) => {
  try {
    const input = typeof req.body.email === "string" ? req.body.email.trim() : "";
    if (!input) {
      return res.status(400).json({ error: "Please enter your registered email address or username" });
    }

    const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({
      $or: [
        { email: { $regex: `^${escaped}$`, $options: "i" } },
        { username: { $regex: `^${escaped}$`, $options: "i" } }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        error: `This account does not exist. Please sign up first before attempting to reset your password.`,
        notRegistered: true,
        email: input
      });
    }
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const resetUrl = `${clientOrigin}/forgot-password?token=${encodeURIComponent(resetToken)}`;

    console.log("\n========================================");
    console.log("🔑 PASSWORD RESET REQUESTED");
    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log("========================================\n");

    let mailSent = false;
    let mailError = null;
    try {
      const mailResult = await sendPasswordResetEmail({
        recipient: user.email,
        username: user.username,
        resetUrl
      });
      console.log("Password reset email accepted by SMTP", {
        recipient: user.email,
        messageId: mailResult?.messageId,
        accepted: mailResult?.accepted,
        response: mailResult?.response
      });
      mailSent = true;
    } catch (sendErr) {
      console.error("Nodemailer send error:", sendErr);
      mailError = sendErr.message;
    }

    const masked = maskEmail(user.email);
    res.json({ 
      success: true, 
      message: mailSent 
        ? `Password reset link sent to ${masked}. Please check your Inbox and Spam/Junk folder.`
        : `Password reset link generated for ${masked}.`,
      email: masked,
      resetUrl,
      mailSent,
      warning: "Be sure to check your Spam or Junk folder if the email is not in your Inbox."
    });
  } catch (err) {
    console.error("Password reset email failed", err);
    res.status(500).json({ error: "Unable to process password reset. Please try again later." });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "A valid token and password of at least 8 characters are required" });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token. Please request a new link." });
    }
    
    await user.setPassword(newPassword);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    
    res.json({ success: true, message: "Password reset successful! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
