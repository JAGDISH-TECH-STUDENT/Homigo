const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 1
    },
    paymentOrderId: {
        type: String,
        index: true,
        sparse: true
    },
    paymentQrCodeId: {
        type: String,
        index: true,
        sparse: true
    },
    paymentQrImageUrl: String,
    paymentId: {
        type: String,
        index: true,
        sparse: true,
        unique: true
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "created", "paid", "failed", "refunded"],
        default: "unpaid"
    },
    refundId: {
        type: String,
        index: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bookingSchema.pre("save", function(next) {
    if (this.checkOut <= this.checkIn) {
        const err = new Error("Check-out date must be after check-in date");
        err.statusCode = 400;
        return next(err);
    }
    next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;

bookingSchema.index({ user: 1 });
bookingSchema.index({ listing: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });