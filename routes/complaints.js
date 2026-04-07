const express = require("express");
const router = express.Router();
const Complaint = require("../models/complaint");
const Notification = require("../models/notification");
const { ensureAuth, ensureHost } = require("../middleware/auth");

router.post("/", ensureAuth, async (req, res) => {
  try {
    const { subject, description, category, priority, againstUser, listing, booking } = req.body;
    const complaint = new Complaint({
      subject,
      description,
      category,
      priority,
      createdBy: req.user._id,
      againstUser,
      listing,
      booking
    });
    await complaint.save();

    if (againstUser) {
      await Notification.create({
        user: againstUser,
        type: 'complaint',
        title: `New Complaint: ${subject}`,
        message: `A complaint has been filed against you: ${description.substring(0, 100)}...`,
        link: '/complaints'
      });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", ensureAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("againstUser", "username email")
      .populate("responses.respondedBy", "username email");
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/respond", ensureAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    complaint.responses.push({
      message: req.body.message,
      respondedBy: req.user._id
    });
    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;