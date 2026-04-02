const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");

module.exports.renderDashboard = async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();
    const guests = await User.countDocuments({ $or: [{ role: 'guest' }, { role: { $exists: false } }] });
    const hosts = await User.countDocuments({ role: 'host' });
    const admins = await User.countDocuments({ role: 'admin' });
    const recentUsers = await User.find().sort({ _id: -1 }).limit(5);
    const recentListings = await Listing.find().sort({ _id: -1 }).limit(5);
    const recentBookings = await Booking.find().sort({ _id: -1 }).limit(5);
    res.json({ totalUsers, totalListings, totalBookings, totalReviews, guests, hosts, admins, recentUsers, recentListings, recentBookings });
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
        .sort({ _id: -1 });
    res.json({ reviews });
};

module.exports.deleteReview = async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    await Listing.updateMany({ reviews: req.params.id }, { $pull: { reviews: req.params.id } });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted" });
};
