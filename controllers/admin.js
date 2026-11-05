const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const Notification = require("../models/notification");
const Complaint = require("../models/complaint");
const Message = require("../models/message");
const { clearCache } = require("../utils/cache.js");

function generateAnalyticsData(bookings = [], listings = [], now = new Date()) {
    const ranges = ['7D', '30D', '3M', '1Y'];
    const result = {};

    // Strictly real confirmed bookings count as platform revenue
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    ranges.forEach(range => {
        let days = 7;
        let numPoints = 7;
        if (range === '30D') { days = 30; numPoints = 10; }
        if (range === '3M') { days = 90; numPoints = 12; }
        if (range === '1Y') { days = 365; numPoints = 12; }

        const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

        // Filter bookings in current period
        const periodBookings = confirmedBookings.filter(b => {
            const d = new Date(b.createdAt);
            return d >= periodStart && d <= now;
        });

        // Filter bookings in previous period
        const prevPeriodBookings = confirmedBookings.filter(b => {
            const d = new Date(b.createdAt);
            return d >= prevPeriodStart && d < periodStart;
        });

        const periodRevenue = periodBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const prevPeriodRevenue = prevPeriodBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        let changePct = 0;
        let isUp = true;
        if (prevPeriodRevenue > 0) {
            changePct = Math.round(((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 * 10) / 10;
            isUp = changePct >= 0;
        } else if (periodRevenue > 0) {
            changePct = 100;
            isUp = true;
        } else {
            changePct = 0;
            isUp = true;
        }

        const points = [];
        const intervalMs = (days * 24 * 60 * 60 * 1000) / (numPoints - 1);

        for (let i = 0; i < numPoints; i++) {
            const pointTime = new Date(periodStart.getTime() + i * intervalMs);
            const bucketStart = new Date(pointTime.getTime() - intervalMs / 2);
            const bucketEnd = new Date(pointTime.getTime() + intervalMs / 2);

            // 100% accurate: sum confirmed bookings in this exact interval
            const bucketRevenue = periodBookings
                .filter(b => {
                    const d = new Date(b.createdAt);
                    return d >= bucketStart && d < bucketEnd;
                })
                .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

            let label = '';
            if (days <= 7) {
                label = pointTime.toLocaleDateString('en-US', { weekday: 'short' });
            } else if (days <= 90) {
                label = pointTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            } else {
                label = pointTime.toLocaleDateString('en-US', { month: 'short' });
            }

            const fullDate = pointTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            points.push({
                label,
                date: fullDate,
                value: bucketRevenue // Exactly 0 if no booking on this date!
            });
        }

        result[range] = {
            revenue: periodRevenue, // Exactly 0 if no confirmed bookings!
            change: changePct >= 0 ? `+${changePct}%` : `${changePct}%`,
            isUp,
            points
        };
    });

    return result;
}

module.exports.renderDashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalListings,
            totalBookings,
            totalReviews,
            guests,
            hosts,
            admins,
            recentUsers,
            recentBookings,
            activeListings,
            confirmedBookings,
            totalRevenueAgg,
            avgListingPriceAgg,
            allListings,
            allBookings
        ] = await Promise.all([
            User.countDocuments(),
            Listing.countDocuments(),
            Booking.countDocuments(),
            Review.countDocuments(),
            User.countDocuments({ $or: [{ role: 'guest' }, { role: { $exists: false } }] }),
            User.countDocuments({ role: 'host' }),
            User.countDocuments({ role: 'admin' }),
            User.find().sort({ _id: -1 }).limit(5).select('username email role createdAt').lean(),
            Booking.find().sort({ _id: -1 }).limit(5).lean(),
            Listing.countDocuments({ active: { $ne: false } }),
            Booking.countDocuments({ status: 'confirmed' }),
            Booking.aggregate([
                { $match: { status: 'confirmed' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Listing.aggregate([
                { $group: { _id: null, avg: { $avg: '$price' } } }
            ]),
            Listing.find().select('title location country price reviews image images').lean(),
            Booking.find().select('createdAt totalPrice status').lean()
        ]);

        const reviewIds = allListings.flatMap(l => l.reviews || []);
        const uniqueReviewIds = [...new Set(reviewIds.map(id => id.toString()))];
        const allReviews = uniqueReviewIds.length > 0 
            ? await Review.find({ _id: { $in: uniqueReviewIds } }).select('rating').lean()
            : [];
        
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
                image: l.image || (l.images && l.images[0]) || null,
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

        const platformAnalytics = generateAnalyticsData(allBookings, allListings);
        
        res.json({ 
            totalUsers, totalListings, totalBookings, totalReviews, guests, hosts, admins, 
            recentUsers, recentListings: recentListingsWithRating, recentBookings,
            activeListings, confirmedBookings,
            totalRevenue: totalRevenueAgg[0]?.total || 0,
            avgListingPrice: avgListingPriceAgg[0]?.avg || 0,
            topListings,
            platformAnalytics
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports.renderUsers = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const [users, total] = await Promise.all([
        User.find().sort({ _id: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
        User.countDocuments()
    ]);
    res.json({ users, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
};

module.exports.renderEditUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
};

module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['guest', 'host', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid user role" });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user._id.equals(req.user._id) && role !== 'admin') {
        return res.status(400).json({ error: "Cannot remove your own admin role" });
    }
    if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) return res.status(400).json({ error: "At least one admin account must remain" });
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
    if (user.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) return res.status(400).json({ error: "Cannot delete the last admin account" });
    }
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
    if (user.role === 'admin') return res.status(400).json({ error: "Admin accounts cannot be blocked" });
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

    const content = `${subject.trim()}\n\n${message.trim()}`;
    const chatMessage = await Message.create({
        from: req.user._id,
        to: user._id,
        content
    });
    
    const notification = new Notification({
        user: id,
        type: 'message',
        title: subject ? `Admin Message: ${subject.trim()}` : 'Message from Admin',
        message: message.trim(),
        link: null,
        data: {
            senderId: req.user._id,
            senderName: 'Admin',
            senderRole: 'admin',
            subject: subject.trim(),
            messageId: chatMessage._id
        }
    });
    
    await notification.save();
    res.json({ success: true, message: "Message sent to user", chatMessage });
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
    
    clearCache();
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
    
    clearCache();
    res.json({ success: true, listing });
};

module.exports.renderListings = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const [listings, total] = await Promise.all([
        Listing.find().populate("owner", "username email").sort({ _id: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
        Listing.countDocuments()
    ]);
    res.json({ listings, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
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
    clearCache();
    res.json({ success: true, message: "Listing and associated data deleted" });
};

module.exports.renderBookings = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const [bookings, total] = await Promise.all([Booking.find()
        .populate("listing", "title")
        .populate("user", "username email")
        .sort({ _id: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit), Booking.countDocuments()]);
    res.json({ bookings, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
};

module.exports.deleteBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Booking deleted" });
};

module.exports.renderReviews = async (req, res) => {
    let reviews = await Review.find()
        .populate("author", "username email")
        .populate("listing", "title")
        .sort({ createdAt: -1 })
        .lean();

    // If any reviews are missing their listing reference (e.g. older legacy reviews),
    // find their parent listing via Listing.reviews array and backfill
    const missingListingReviews = reviews.filter(r => !r.listing || !r.listing.title);
    if (missingListingReviews.length > 0) {
        const reviewIds = missingListingReviews.map(r => r._id);
        const parentListings = await Listing.find({ reviews: { $in: reviewIds } })
            .select('title reviews')
            .lean();

        const reviewToListingMap = {};
        parentListings.forEach(l => {
            (l.reviews || []).forEach(rId => {
                reviewToListingMap[rId.toString()] = { _id: l._id, title: l.title };
            });
        });

        const bulkOps = [];
        reviews = reviews.map(r => {
            if ((!r.listing || !r.listing.title) && reviewToListingMap[r._id.toString()]) {
                const foundListing = reviewToListingMap[r._id.toString()];
                bulkOps.push({
                    updateOne: {
                        filter: { _id: r._id },
                        update: { $set: { listing: foundListing._id } }
                    }
                });
                return { ...r, listing: foundListing };
            }
            return r;
        });

        if (bulkOps.length > 0) {
            Review.bulkWrite(bulkOps).catch(err => console.error("Backfill review.listing error:", err));
        }
    }

    res.json({ reviews });
};

module.exports.deleteReview = async (req, res) => {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    await Listing.updateMany({ reviews: req.params.id }, { $pull: { reviews: req.params.id } });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review deleted" });
};

module.exports.renderNotifications = async (req, res) => {
    try {
        const [recentUsers, recentListings, recentReviews, recentComplaints] = await Promise.all([
            User.find()
                .sort({ _id: -1 })
                .limit(8)
                .select('username email role createdAt')
                .lean(),
            Listing.find()
                .sort({ _id: -1 })
                .limit(8)
                .populate('owner', 'username email')
                .select('title location country price owner createdAt')
                .lean(),
            Review.find()
                .sort({ _id: -1 })
                .limit(8)
                .populate('author', 'username')
                .populate('listing', 'title')
                .select('rating comment author listing createdAt')
                .lean(),
            Complaint.find()
                .sort({ _id: -1 })
                .limit(8)
                .populate('createdBy', 'username email')
                .populate('listing', 'title')
                .select('subject description category priority status createdBy listing createdAt')
                .lean()
        ]);

        const notifs = [];

        // Fill missing listing references for recentReviews if any
        const missingNotifReviews = recentReviews.filter(r => !r.listing || !r.listing.title);
        if (missingNotifReviews.length > 0) {
            const rIds = missingNotifReviews.map(r => r._id);
            const pListings = await Listing.find({ reviews: { $in: rIds } }).select('title reviews').lean();
            const rMap = {};
            pListings.forEach(l => {
                (l.reviews || []).forEach(id => { rMap[id.toString()] = { _id: l._id, title: l.title }; });
            });
            recentReviews.forEach(r => {
                if ((!r.listing || !r.listing.title) && rMap[r._id.toString()]) {
                    r.listing = rMap[r._id.toString()];
                }
            });
        }

        // 1. Users
        recentUsers.forEach(u => {
            const time = u.createdAt || (u._id && typeof u._id.getTimestamp === 'function' ? u._id.getTimestamp() : new Date());
            notifs.push({
                id: `user-${u._id}`,
                type: 'user',
                title: 'New User Registered',
                message: `@${u.username} joined as ${u.role || 'guest'}.`,
                meta: { username: u.username, role: u.role, email: u.email },
                link: '/admin/users',
                createdAt: time
            });
        });

        // 2. Listings
        recentListings.forEach(l => {
            const time = l.createdAt || (l._id && typeof l._id.getTimestamp === 'function' ? l._id.getTimestamp() : new Date());
            notifs.push({
                id: `listing-${l._id}`,
                type: 'listing',
                title: 'New Listing Added',
                message: `"${l.title}" listed in ${l.location || 'Unknown'}${l.owner?.username ? ` by @${l.owner.username}` : ''}.`,
                meta: { title: l.title, location: l.location, price: l.price, owner: l.owner?.username },
                link: '/admin/listings',
                createdAt: time
            });
        });

        // 3. Reviews
        recentReviews.forEach(r => {
            const time = r.createdAt || (r._id && typeof r._id.getTimestamp === 'function' ? r._id.getTimestamp() : new Date());
            notifs.push({
                id: `review-${r._id}`,
                type: 'review',
                title: 'New Review Posted',
                message: `@${r.author?.username || 'Guest'} rated ${r.rating}★ for "${r.listing?.title || 'Listing'}".`,
                meta: { rating: r.rating, comment: r.comment, author: r.author?.username, listing: r.listing?.title },
                link: '/admin/reviews',
                createdAt: time
            });
        });

        // 4. Complaints
        recentComplaints.forEach(c => {
            const time = c.createdAt || (c._id && typeof c._id.getTimestamp === 'function' ? c._id.getTimestamp() : new Date());
            notifs.push({
                id: `complaint-${c._id}`,
                type: 'complaint',
                title: `Complaint: ${c.subject}`,
                message: `${c.createdBy?.username ? `@${c.createdBy.username}` : 'User'} reported [${c.category}]: "${(c.description || '').slice(0, 65)}${c.description && c.description.length > 65 ? '...' : ''}"`,
                meta: { category: c.category, priority: c.priority, status: c.status, subject: c.subject },
                link: '/admin/complaints',
                createdAt: time
            });
        });

        // Sort descending by time
        notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const counts = {
            all: notifs.length,
            user: notifs.filter(n => n.type === 'user').length,
            listing: notifs.filter(n => n.type === 'listing').length,
            review: notifs.filter(n => n.type === 'review').length,
            complaint: notifs.filter(n => n.type === 'complaint').length
        };

        res.json({
            success: true,
            notifications: notifs.slice(0, 25),
            counts
        });
    } catch (err) {
        console.error("renderNotifications error:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};
