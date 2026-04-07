const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Notification = require("../models/notification");

module.exports.renderDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalReviews = await Review.countDocuments();
        const guests = await User.countDocuments({ $or: [{ role: 'guest' }, { role: { $exists: false } }] });
        const hosts = await User.countDocuments({ role: 'host' });
        const admins = await User.countDocuments({ role: 'admin' });
        const recentUsers = await User.find().sort({ _id: -1 }).limit(5).select('username email role createdAt');
        const recentBookings = await Booking.find().sort({ _id: -1 }).limit(5);
        const activeListings = await Listing.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const avgListingPrice = await Listing.aggregate([
            { $group: { _id: null, avg: { $avg: '$price' } } }
        ]);
        
        const allListings = await Listing.find();
        const reviewIds = allListings.flatMap(l => l.reviews || []);
        const uniqueReviewIds = [...new Set(reviewIds.map(id => id.toString()))];
        const allReviews = await Review.find({ _id: { $in: uniqueReviewIds } });
        
        const reviewMap = {};
        allReviews.forEach(r => { reviewMap[r._id.toString()] = r; });
        
        const listingsWithRating = allListings.map(l => {
            const reviewsArr = (l.reviews || []).map(id => reviewMap[id.toString()]).filter(Boolean);
            const count = reviewsArr.length;
            const totalRating = reviewsArr.reduce((sum, r) => sum + (r.rating || 0), 0);
            const avg = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;
            
            return {
                _id: l._id,
                title: l.title,
                location: l.location,
                country: l.country,
                price: l.price,
                avgRating: avg,
                reviewsCount: count
            };
        });
        
        const recentListingsWithRating = [...listingsWithRating]
            .sort((a, b) => b._id.toString().localeCompare(a._id.toString()))
            .slice(0, 5);
        
        const topListings = [...listingsWithRating]
            .sort((a, b) => {
                if (b.avgRating !== a.avgRating) {
                    return b.avgRating - a.avgRating;
                }
                return b.reviewsCount - a.reviewsCount;
            })
            .slice(0, 5);
        
        console.log('Dashboard response - activeListings:', activeListings, 'totalListings:', totalListings);
        
        res.json({ 
            totalUsers, totalListings, totalBookings, totalReviews, guests, hosts, admins, 
            recentUsers, recentListings: recentListingsWithRating, recentBookings,
            activeListings, confirmedBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            avgListingPrice: avgListingPrice[0]?.avg || 0,
            topListings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports.renderUsers = async (req, res) => {
    const users = await User.find().sort({ _id: -1 });
    res.json({ users });
};

module.exports.renderEditUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
};

module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user._id.equals(req.user._id) && role !== 'admin') {
        return res.status(400).json({ error: "Cannot change your own admin role" });
    }
    user.role = role;
    await user.save();
    res.json({ success: true, user });
};

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    if (req.user._id.equals(id)) {
        return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Listing.deleteMany({ owner: id });
    await Booking.deleteMany({ user: id });
    await Review.deleteMany({ author: id });
    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User and associated data deleted" });
};

module.exports.blockUser = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (req.user._id.equals(id)) {
        return res.status(400).json({ error: "Cannot block your own account" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.blocked = true;
    user.blockReason = reason || 'Violation of terms';
    user.blockedAt = new Date();
    await user.save();
    res.json({ success: true, user });
};

module.exports.unblockUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.blocked = false;
    user.blockReason = null;
    user.blockedAt = null;
    await user.save();
    res.json({ success: true, user });
};

module.exports.sendMessageToUser = async (req, res) => {
    const { id } = req.params;
    const { message, subject } = req.body;
    
    if (!message || !subject) {
        return res.status(400).json({ error: "Subject and message are required" });
    }
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const notification = new Notification({
        user: id,
        type: 'system',
        title: subject,
        message: message,
        link: null
    });
    
    await notification.save();
    res.json({ success: true, message: "Message sent to user" });
};

module.exports.deactivateListing = async (req, res) => {
    const listing = await Listing.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
    ).populate("owner", "username email");
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    
    if (listing.owner) {
        await Notification.create({
            user: listing.owner._id,
            type: 'listing',
            title: 'Listing Deactivated',
            message: `Your listing "${listing.title}" has been deactivated by admin. Contact support for details.`,
            link: `/listings/${listing._id}`
        });
    }
    
    res.json({ success: true, listing });
};

module.exports.activateListing = async (req, res) => {
    const listing = await Listing.findByIdAndUpdate(
        req.params.id,
        { active: true },
        { new: true }
    ).populate("owner", "username email");
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    
    if (listing.owner) {
        await Notification.create({
            user: listing.owner._id,
            type: 'listing',
            title: 'Listing Activated',
            message: `Your listing "${listing.title}" has been activated by admin.`,
            link: `/listings/${listing._id}`
        });
    }
    
    res.json({ success: true, listing });
};

module.exports.renderListings = async (req, res) => {
    const listings = await Listing.find().populate("owner", "username email").sort({ _id: -1 });
    res.json({ listings });
};

module.exports.renderEditListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id).populate("owner", "username email");
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing });
};

module.exports.deleteListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ listing: req.params.id });
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Listing and associated data deleted" });
};

module.exports.renderBookings = async (req, res) => {
    const bookings = await Booking.find()
        .populate("listing", "title")
        .populate("user", "username email")
        .sort({ _id: -1 });
    res.json({ bookings });
};

module.exports.deleteBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
};

module.exports.renderReviews = async (req, res) => {
    const reviews = await Review.find()
        .populate("author", "username email")
        .populate("listing", "title")
        .sort({ createdAt: -1 });
    res.json({ reviews });
};

module.exports.deleteReview = async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    await Listing.updateMany({ reviews: req.params.id }, { $pull: { reviews: req.params.id } });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted" });
};
