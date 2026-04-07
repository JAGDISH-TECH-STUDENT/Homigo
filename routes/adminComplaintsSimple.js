const express = require("express");
const router = express.Router();
const Complaint = require("../models/complaint");
const Notification = require("../models/notification");
const { ensureAuth, ensureAdmin } = require("../middleware/auth");

router.get("/", ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("createdBy", "username email")
            .populate("againstUser", "username email")
            .populate("listing", "title")
            .sort({ createdAt: -1 });
        
        const stats = {
            open: complaints.filter(c => c.status === 'open').length,
            in_progress: complaints.filter(c => c.status === 'in_progress').length,
            resolved: complaints.filter(c => c.status === 'resolved').length,
            closed: complaints.filter(c => c.status === 'closed').length
        };
        
        res.json({ complaints, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id/status", ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                resolvedAt: status === 'resolved' ? new Date() : null
            },
            { new: true }
        ).populate("createdBy", "username email").populate("againstUser", "username email");
        
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        if (complaint.createdBy) {
            await Notification.create({
                user: complaint.createdBy._id,
                type: 'complaint',
                title: `Complaint Status: ${status}`,
                message: `Your complaint "${complaint.subject}" has been marked as ${status}`,
                link: '/complaints'
            });
        }

        res.json({ success: true, complaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/:id/respond", ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        
        const responseMsg = req.body.message;
        complaint.responses.push({
            message: responseMsg,
            respondedBy: req.user._id
        });
        
        if (req.body.status) {
            complaint.status = req.body.status;
            complaint.resolvedAt = req.body.status === 'resolved' ? new Date() : null;
        }
        
        await complaint.save();
        
        const populatedComplaint = await Complaint.findById(complaint._id)
            .populate("createdBy", "username email")
            .populate("againstUser", "username email");

        if (populatedComplaint.createdBy) {
            await Notification.create({
                user: populatedComplaint.createdBy._id,
                type: 'complaint',
                title: `Complaint Response`,
                message: `Admin has responded to your complaint: ${responseMsg.substring(0, 100)}...`,
                link: '/complaints'
            });
        }

        res.json({ success: true, complaint: populatedComplaint });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;