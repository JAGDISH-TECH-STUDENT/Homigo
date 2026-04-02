const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }
    const newReview = new Review({
        rating: req.body.review.rating,
        comment: req.body.review.comment,
        author: req.user._id
    });
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    const populated = await Review.findById(newReview._id).populate("author", "username");
    res.status(201).json({ success: true, review: populated });
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({ error: "Review not found" });
    }
    if (!review.author || !review.author.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized to delete this review" });
    }
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.json({ success: true, message: "Review deleted" });
};
