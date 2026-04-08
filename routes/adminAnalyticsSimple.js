const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const { cache } = require("../utils/cache.js");

router.get("/", cache("5 minutes"), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHosts = await User.countDocuments({ role: 'host' });
        const totalListings = await Listing.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        
        const totalRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        
        const monthlyRevenue = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 12 }
        ]);
        
        const bookingsByStatus = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const allListings = await Listing.find().select('location').limit(50);
        const locationMap = {};
        allListings.forEach(l => {
            if (l.location) {
                const loc = l.location.trim();
                if (loc) {
                    locationMap[loc] = (locationMap[loc] || 0) + 1;
                }
            }
        });
        
        const topLocations = Object.entries(locationMap)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        
        const topListings = await Listing.find().sort({ createdAt: -1 }).limit(5).select('title location price owner');
        
        const populatedListings = await Listing.populate(topListings, { path: 'owner', select: 'username' });
        
        const platformCommission = (totalRevenue[0]?.total || 0) * 0.10;
        
        res.json({
            overview: { 
                totalUsers, 
                totalHosts,
                totalListings, 
                totalBookings, 
                confirmedBookings,
                pendingBookings,
                totalRevenue: totalRevenue[0]?.total || 0,
                platformCommission,
                avgListingPrice: 0
            },
            stats: { newUsers: 0, newListings: 0, newBookings: 0 },
            charts: { 
                monthlyRevenue: monthlyRevenue.map(m => ({ month: m._id, revenue: m.total, bookings: m.count })),
                bookingsByStatus: bookingsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
                topLocations: topLocations,
                topListings: populatedListings.map(l => ({ _id: l._id, title: l.title, location: l.location, owner: l.owner?.username }))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;