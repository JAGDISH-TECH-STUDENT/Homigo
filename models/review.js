const mongoose=require("mongoose");

const reviewSchema= new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    rating:{
        type:Number,
        required: true,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:()=>Date.now()
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
    },
});

module.exports=mongoose.model("Review",reviewSchema);

reviewSchema.index({ listing: 1 });
reviewSchema.index({ author: 1 });
reviewSchema.index({ rating: 1 });