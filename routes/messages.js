const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const { ensureAuth } = require("../middleware/auth");

router.get("/", ensureAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.user._id }, { to: req.user._id }]
    })
    .populate("from", "username email")
    .populate("to", "username email")
    .populate("listing", "title")
    .sort({ createdAt: -1 });
    
    const conversations = {};
    messages.forEach(m => {
      const otherId = m.from._id.equals(req.user._id) ? m.to._id : m.from._id;
      const otherName = m.from._id.equals(req.user._id) ? m.to.username : m.from.username;
      if (!conversations[otherId]) {
        conversations[otherId] = { userId: otherId, username: otherName, lastMessage: m, unread: 0 };
      }
      if (!m.isRead && m.to._id.equals(req.user._id)) {
        conversations[otherId].unread++;
      }
    });
    
    res.json({ conversations: Object.values(conversations) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", ensureAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    })
    .populate("from", "username email")
    .populate("to", "username email")
    .populate("listing", "title")
    .sort({ createdAt: 1 });
    
    await Message.updateMany(
      { from: req.params.userId, to: req.user._id },
      { isRead: true }
    );
    
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", ensureAuth, async (req, res) => {
  try {
    const { to, listing, content } = req.body;
    const message = new Message({
      from: req.user._id,
      to,
      listing,
      content
    });
    await message.save();
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;