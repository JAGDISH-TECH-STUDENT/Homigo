const Review=require("../models/review.js");
const Listing=require("../models/listing.js");
module.exports.createReview=async(req,res)=>{

    let listing=await Listing.findById(req.params.id);
    if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
    const { rating, comment } = req.body.review;

    const newReview = new Review({
    rating:req.body.review.rating,
    comment:req.body.review.comment,
    author: req.user._id
    });

   
    listing.reviews.push(newReview);
    console.log("Review schema paths:", Object.keys(newReview.schema.paths));
     await newReview.save();
    await listing.save();
    req.flash("success","New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.deleteReview=async(req,res)=>{
    let { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }
    
    if (!req.user) {
        req.flash("error", "You must be logged in to delete reviews!");
        return res.redirect(`/listings/${id}`);
    }
    
    if (!review.author || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not authorized to delete this review!");
        return res.redirect(`/listings/${id}`);
    }
    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
     req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`); 
};