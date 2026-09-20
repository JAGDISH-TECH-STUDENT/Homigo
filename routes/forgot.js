const express = require("express");
const router = express.Router();
const User = require("../models/user");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/mailer");

const TOKEN_TTL_MS = 15 * 60 * 1000;

router.post("/", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await User.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
    
    if (!user) {
      return res.json({ success: true, message: "If email exists, reset link sent" });
    }
    
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await user.save();

    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const resetUrl = `${clientOrigin}/forgot-password?token=${encodeURIComponent(resetToken)}`;
    const mailResult = await sendPasswordResetEmail({ recipient: user.email, resetUrl });
    console.log("Password reset email accepted by SMTP", {
      recipient: user.email,
      messageId: mailResult.messageId,
      accepted: mailResult.accepted,
      rejected: mailResult.rejected,
      response: mailResult.response
    });
    
    res.json({ 
      success: true, 
      message: "If the email exists, a password reset link has been sent"
    });
  } catch (err) {
    console.error("Password reset email failed", err);
    res.status(500).json({ error: "Unable to send password reset email. Please try again later." });
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
      return res.status(400).json({ error: "Invalid token" });
    }
    
    await user.setPassword(newPassword);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;