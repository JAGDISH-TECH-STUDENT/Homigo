const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../models/message");
const Notification = require("../models/notification");
const User = require("../models/user");
const { ensureAuth } = require("../middleware/auth");

router.get("/", ensureAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const messages = await Message.find({
      $or: [{ from: req.user._id }, { to: req.user._id }]
    })
    .populate("from", "username role")
    .populate("to", "username role")
    .populate("listing", "title")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
    
    const conversations = {};
    messages.forEach(m => {
      const otherId = m.from._id.equals(req.user._id) ? m.to._id : m.from._id;
      const otherUser = m.from._id.equals(req.user._id) ? m.to : m.from;
      const otherName = otherUser.role === 'admin' ? 'Admin' : otherUser.username;
      if (!conversations[otherId]) {
        conversations[otherId] = { userId: otherId, username: otherName, lastMessage: m, unread: 0 };
      }
      if (!m.isRead && m.to._id.equals(req.user._id)) {
        conversations[otherId].unread++;
      }
    });
    
    res.json({ conversations: Object.values(conversations), pagination: { page, limit, hasMore: messages.length === limit } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId", ensureAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ error: "Invalid recipient" });
    }
    const recipient = await User.findById(req.params.userId).select("_id blocked");
    if (!recipient || recipient.blocked) return res.status(404).json({ error: "User not found" });
    if (recipient._id.equals(req.user._id)) return res.status(400).json({ error: "Invalid conversation" });

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    })
    .populate("from", "username role")
    .populate("to", "username role")
    .populate("listing", "title")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
    
    await Message.updateMany(
      { from: req.params.userId, to: req.user._id },
      { isRead: true }
    );
    
    res.json({ messages: messages.reverse(), pagination: { page, limit, hasMore: messages.length === limit } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", ensureAuth, async (req, res) => {
  try {
    if (req.user.role === "guest") {
      return res.status(403).json({ error: "Guests can view messages but cannot send messages" });
    }
    const { to, listing, content } = req.body;
    if (!mongoose.isValidObjectId(to)) {
      return res.status(400).json({ error: "Valid recipient is required" });
    }
    if (to.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot message yourself" });
    }
    if (typeof content !== "string" || content.trim().length < 1 || content.length > 2000) {
      return res.status(400).json({ error: "Message must be between 1 and 2000 characters" });
    }
    const recipient = await User.findById(to).select("_id blocked");
    if (!recipient || recipient.blocked) return res.status(404).json({ error: "Recipient not found" });
    if (listing && !mongoose.isValidObjectId(listing)) {
      return res.status(400).json({ error: "Invalid listing" });
    }
    const message = new Message({
      from: req.user._id,
      to,
      listing,
      content: content.trim()
    });
    await message.save();
    
    await Notification.create({
      user: to,
      type: 'message',
      title: `New message from ${req.user.username}`,
      message: content.substring(0, 100),
      link: `/chat/${req.user._id}`,
      data: { user: req.user.username }
    });
    
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;