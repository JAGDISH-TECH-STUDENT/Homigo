const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");

const userSchema=new Schema({
    email: {
        type: String,
        required: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    role: {
        type: String,
        enum: ['guest', 'host', 'admin'],
        default: 'guest'
    },
    blocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String,
        default: null
    },
    blockedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",userSchema);