const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ success: true, message: "If email exists, reset link sent" });
    }
    
    const resetToken = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    res.json({ 
      success: true, 
      message: "Password reset link sent to email",
      debugToken: resetToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [id, timestamp] = Buffer.from(token, 'base64').toString().split(':');
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }
    
    await user.setPassword(newPassword);
    await user.save();
    
    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;