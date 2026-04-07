const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Complaint = require("../models/complaint");
const { ensureAdmin } = require("../middleware/auth");

router.get("/", ensureAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      totalUsers,
      totalHosts,
      totalListings,
      totalBookings,
      totalRevenue,
      activeListings,
      pendingComplaints,
      newUsers,
      newListings,
      newBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'host' }),
      Listing.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Listing.countDocuments({ active: true }),
      Complaint.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Listing.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed', createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } }
    ]);

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topLocations = await Listing.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topHosts = await User.aggregate([
      { $match: { role: 'host' } },
      { $lookup: { from: 'listings', localField: '_id', foreignField: 'owner', as: 'listings' } },
      { $project: { username: 1, listingCount: { $size: '$listings' } } },
      { $sort: { listingCount: -1 } },
      { $limit: 5 }
    ]);

    const recentActivity = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('username email role createdAt'),
      Booking.find().sort({ createdAt: -1 }).limit(5).populate('listing', 'title').populate('user', 'username'),
      Review.find().sort({ createdAt: -1 }).limit(5).populate('author', 'username')
    ]);

    res.json({
      overview: {
        totalUsers,
        totalHosts,
        totalListings,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeListings,
        pendingComplaints,
        avgListingPrice: await Listing.aggregate([{ $group: { _id: null, avg: { $avg: '$price' } } }]).then(r => r[0]?.avg || 0)
      },
      stats: {
        newUsers,
        newListings,
        newBookings
      },
      charts: {
        monthlyRevenue: monthlyRevenue.map(m => ({ month: m._id, revenue: m.total })),
        bookingsByStatus: bookingsByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        topLocations: topLocations.map(l => ({ location: l._id, count: l.count })),
        topHosts
      },
      recentActivity: {
        users: recentActivity[0],
        bookings: recentActivity[1],
        reviews: recentActivity[2]
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;