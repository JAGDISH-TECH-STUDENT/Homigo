const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const { ensureAuth } = require("../middleware/auth");

router.get("/", ensureAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/read", ensureAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/readAll", ensureAuth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/read", ensureAuth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id, isRead: true });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    await Notification.create({ user: userId, type, title, message, link, data });
  } catch (err) {
    console.error("Notification error:", err);
  }
};

module.exports = { router, createNotification };