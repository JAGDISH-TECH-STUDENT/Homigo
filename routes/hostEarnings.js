const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const { ensureAuth, ensureHost } = require("../middleware/auth");

router.get("/", ensureAuth, ensureHost, async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id });
        const listingIds = listings.map(l => l._id);
        
        const bookings = await Booking.find({ listing: { $in: listingIds } });
        
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        
        const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const pendingPayments = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const commission = totalEarnings * 0.10;
        
        const monthlyEarnings = await Booking.aggregate([
            { $match: { listing: { $in: listingIds }, status: 'confirmed' } },
            { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
            { $limit: 12 }
        ]);
        
        const earningsByListing = {};
        confirmedBookings.forEach(b => {
            const lid = b.listing.toString();
            if (!earningsByListing[lid]) earningsByListing[lid] = 0;
            earningsByListing[lid] += b.totalPrice || 0;
        });
        
        const listingStats = listings.map(l => ({
            _id: l._id,
            title: l.title,
            earnings: earningsByListing[l._id.toString()] || 0,
            bookings: confirmedBookings.filter(b => b.listing.toString() === l._id.toString()).length
        }));
        
        res.json({
            overview: {
                totalEarnings,
                pendingPayments,
                commission,
                netEarnings: totalEarnings - commission,
                totalBookings: confirmedBookings.length,
                activeListings: listings.filter(l => l.active).length
            },
            monthlyEarnings: monthlyEarnings.map(m => ({ month: m._id, earnings: m.total, bookings: m.count })),
            listingStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;