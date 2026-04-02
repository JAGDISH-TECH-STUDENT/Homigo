const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");

module.exports.renderDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalReviews = await Review.countDocuments();
        
        const guests = await User.countDocuments({ 
            $or: [
                { role: 'guest' },
                { role: { $exists: false } }
            ]
        });
        const hosts = await User.countDocuments({ role: 'host' });
        const admins = await User.countDocuments({ role: 'admin' });
        
        const recentUsers = await User.find().sort({ _id: -1 }).limit(5);
        const recentListings = await Listing.find().sort({ _id: -1 }).limit(5);
        const recentBookings = await Booking.find().sort({ _id: -1 }).limit(5);
        
        res.render("admin/dashboard", {
            totalUsers,
            totalListings,
            totalBookings,
            totalReviews,
            guests,
            hosts,
            admins,
            recentUsers,
            recentListings,
            recentBookings
        });
    } catch (e) {
        req.flash("error", "Error loading dashboard");
        res.redirect("/listings");
    }
};

module.exports.renderUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ _id: -1 });
        res.render("admin/users", { users });
    } catch (e) {
        req.flash("error", "Error loading users");
        res.redirect("/admin/dashboard");
    }
};

module.exports.renderEditUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }
        res.render("admin/edit-user", { user });
    } catch (e) {
        req.flash("error", "Error loading user");
        res.redirect("/admin/users");
    }
};

module.exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }
        
                if (user._id.equals(req.user._id) && role !== 'admin') {
            req.flash("error", "You cannot change your own admin role");
            return res.redirect("/admin/users");
        }
        
        user.role = role;
        await user.save();
        
        req.flash("success", "User updated successfully");
        res.redirect("/admin/users");
    } catch (e) {
        req.flash("error", "Error updating user");
        res.redirect("/admin/users");
    }
};

module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
                if (req.user._id.equals(id)) {
            req.flash("error", "You cannot delete your own account");
            return res.redirect("/admin/users");
        }
        
        const user = await User.findById(id);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/users");
        }
        
                await Listing.deleteMany({ owner: id });
        
                await Booking.deleteMany({ user: id });
        
                await Review.deleteMany({ author: id });
        
                await User.findByIdAndDelete(id);
        
        req.flash("success", "User and associated data deleted successfully");
        res.redirect("/admin/users");
    } catch (e) {
        req.flash("error", "Error deleting user");
        res.redirect("/admin/users");
    }
};

module.exports.renderListings = async (req, res) => {
    try {
        const listings = await Listing.find().populate("owner", "username email").sort({ _id: -1 });
        res.render("admin/listings", { listings });
    } catch (e) {
        req.flash("error", "Error loading listings");
        res.redirect("/admin/dashboard");
    }
};

module.exports.renderEditListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).populate("owner", "username email");
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/admin/listings");
        }
        res.render("admin/edit-listing", { listing });
    } catch (e) {
        req.flash("error", "Error loading listing");
        res.redirect("/admin/listings");
    }
};

module.exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/admin/listings");
        }

        await Review.deleteMany({ _id: { $in: listing.reviews } });

        await Booking.deleteMany({ listing: id });

        await Listing.findByIdAndDelete(id);
        
        req.flash("success", "Listing and associated data deleted successfully");
        res.redirect("/admin/listings");
    } catch (e) {
        req.flash("error", "Error deleting listing");
        res.redirect("/admin/listings");
    }
};

module.exports.renderBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("listing", "title")
            .populate("user", "username email")
            .sort({ _id: -1 });
        res.render("admin/bookings", { bookings });
    } catch (e) {
        req.flash("error", "Error loading bookings");
        res.redirect("/admin/dashboard");
    }
};

module.exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        
        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/admin/bookings");
        }
        
        await Booking.findByIdAndDelete(id);
        
        req.flash("success", "Booking deleted successfully");
        res.redirect("/admin/bookings");
    } catch (e) {
        req.flash("error", "Error deleting booking");
        res.redirect("/admin/bookings");
    }
};

module.exports.renderReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("author", "username email")
            .sort({ _id: -1 });
        res.render("admin/reviews", { reviews });
    } catch (e) {
        req.flash("error", "Error loading reviews");
        res.redirect("/admin/dashboard");
    }
};

module.exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        
        if (!review) {
            req.flash("error", "Review not found");
            return res.redirect("/admin/reviews");
        }

        await Listing.updateMany(
            { reviews: id },
            { $pull: { reviews: id } }
        );
        
        await Review.findByIdAndDelete(id);
        
        req.flash("success", "Review deleted successfully");
        res.redirect("/admin/reviews");
    } catch (e) {
        req.flash("error", "Error deleting review");
        res.redirect("/admin/reviews");
    }
};
