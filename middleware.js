const Listing =require("./models/listing.js");
const ExpressError=require("./utils/ExpressError.js");
const { ListingSchema,reviewSchema }=require("./schema.js");
const review = require("./models/review.js");
const Review =require("./models/review.js");


module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
};
module.exports.isLoggedInForDelete=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be logged in to Delete listing!");
        return res.redirect("/login");
    }
    next();
};
module.exports.isLoggedInForEdit=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be logged in to Edit listing!");
        return res.redirect("/login");
    }
    next();
};
module.exports.saveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};


module.exports.isOwner=async (req,res,next)=>{
    let {id} =req.params;
    let listing =await Listing.findById(id);
    if(!listing || !listing.owner || !listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You are not owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing= (req, res, next)=>{
    let { error }=ListingSchema.validate(req.body);
    
    if(error){
        const errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
};

module.exports.validateReview= (req,res,next)=>{
    let { error }=reviewSchema.validate(req.body);
    
    if(error){
        const errMsg = error.details.map(el => el.message).join(",");

        throw new ExpressError(400, errMsg);
    }else{
        next();
    } 
};
module.exports.isReviewAuthor=async (req,res,next)=>{
    let {id,reviewId} =req.params;
    let review =await Review.findById(reviewId);
    if(!review || !review.author || !review.author.equals(res.locals.currUser._id)){
        req.flash("error","You are not author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};



