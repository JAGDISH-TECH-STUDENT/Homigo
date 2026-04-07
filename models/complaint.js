const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complaintSchema = new Schema({
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'listing', 'host', 'guest', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  againstUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing'
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  responses: [{
    message: String,
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);