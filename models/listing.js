const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        default: true
    },
    images: [{
        filename: { type: String, default: "no-image" },
        url: {
            type: String,
            default: "https://thumbs.dreamstime.com/z/no-photo-available-missing-image-no-image-symbol-isolated-white-background-no-photo-available-missing-image-no-image-272386839.jpg"
        },
    }],
    price: {
        type: Number,
        required: true,
        min: 1,
    },
    location: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Trending', 'Rooms', 'Iconic cities', 'Mountains', 'Castles', 'Amazing pools', 'Camping', 'Farms', 'Arctic', 'Domes', 'Boats'],
        default: 'Trending'
    },
    maxGuests: {
        type: Number,
        min: 1,
        default: 10
    },
    bedrooms: {
        type: Number,
        min: 0,
        default: 1
    },
    beds: {
        type: Number,
        min: 0,
        default: 1
    },
    baths: {
        type: Number,
        min: 0,
        default: 1
    },
    amenities: [{
        type: String,
    }],
    houseRules: {
        type: String,
    },
    checkInTime: {
        type: String,
        default: "12:00 PM"
    },
    checkOutTime: {
        type: String,
        default: "10:00 AM"
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            default: [0, 0]
        }
    },
    unavailableDates: [{
        type: Date
    }],
    bookingLockUntil: {
        type: Date,
        default: null
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    discountStart: Date,
    discountEnd: Date
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

listingSchema.index({ category: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ location: 1 });
listingSchema.index({ owner: 1 });
listingSchema.index({ createdAt: -1 });