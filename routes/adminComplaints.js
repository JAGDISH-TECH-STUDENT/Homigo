const express = require("express");
const router = express.Router();
const Complaint = require("../models/complaint");
const { ensureAdmin } = require("../middleware/auth");

router.get("/", ensureAdmin, async (req, res) => {
  try {
    const { status, category, priority, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    const complaints = await Complaint.find(filter)
      .populate("createdBy", "username email")
      .populate("againstUser", "username email")
      .populate("listing", "title")
      .sort(sort);
    
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    res.json({ complaints, stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", ensureAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("againstUser", "username email")
      .populate("listing", "title location")
      .populate("booking", "checkIn checkOut guests")
      .populate("responses.respondedBy", "username email role");
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", ensureAdmin, async (req, res) => {
  try {
    const { status, priority, assignedTo, resolution } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (status === 'resolved' || status === 'closed') complaint.resolvedAt = new Date();
    
    if (resolution) {
      complaint.responses.push({
        message: resolution,
        respondedBy: req.user._id
      });
    }
    
    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", ensureAdmin, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Complaint deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;