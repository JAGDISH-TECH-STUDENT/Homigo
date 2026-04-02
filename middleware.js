const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { ListingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in" });
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing || !listing.owner || !listing.owner.equals(req.user._id)) {
        return res.status(403).json({ error: "You are not the owner of this listing" });
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    const { error } = ListingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        return res.status(400).json({ error: errMsg });
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(",");
        return res.status(400).json({ error: errMsg });
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review || !review.author || !review.author.equals(req.user._id)) {
        return res.status(403).json({ error: "You are not the author of this review" });
    }
    next();
};

module.exports.isHost = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in" });
    }
    if (req.user.role !== 'host') {
        return res.status(403).json({ error: "Only hosts can perform this action" });
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "You must be logged in" });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can perform this action" });
    }
    next();
};
