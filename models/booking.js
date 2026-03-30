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
        required: true
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

// Validation: check-out must be after check-in
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