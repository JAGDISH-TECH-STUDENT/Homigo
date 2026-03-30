const User=require("../models/user");
module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
};
module.exports.signUp=async(req,res)=>{
    try{
        let {username, email, password, role} =req.body;
        const newUser=new User({email, username, role: role || 'guest'});
        const registeredUser=await User.register(newUser, password);
        req.login(registeredUser,(err)=>{
            if(err){
                return next(err);
            }
            if(role === 'host'){
                req.flash("success","Welcome to Homigo! You can now list your property.");
                res.redirect("/host/dashboard");
            } else {
                req.flash("success","Welcome to Homigo!");
                res.redirect("/listings");
            }
        });
    } catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
    
};
module.exports.renderLoginForm=(req,res)=>{
    res.render("users/login.ejs");
};
module.exports.login=async (req,res)=>{
    req.flash("success","Welcome back to Homigo!");
    let redirectUrl=res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};
module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err); 
        }
        req.flash("success","you are logged out!");
        res.redirect("/listings");
    });
};

module.exports.upgradeToHost=async(req,res,next)=>{
    try{
        if(req.user.role === 'host'){
            req.flash("error","You are already a host!");
            return res.redirect("/host/dashboard");
        }
        
        req.user.role = 'host';
        await req.user.save();
        
        req.flash("success","You are now a host! You can list your property.");
        res.redirect("/host/dashboard");
    } catch(e){
        req.flash("error",e.message);
        res.redirect("/listings");
    }
};