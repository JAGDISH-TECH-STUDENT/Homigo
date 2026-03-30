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
    }
})

userSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",userSchema);