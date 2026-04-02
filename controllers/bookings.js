const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.createBooking = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }
        if (listing.owner.equals(req.user._id)) {
            return res.status(400).json({ error: "You cannot book your own listing" });
        }
        if (req.user.role === 'host') {
            return res.status(400).json({ error: "Hosts cannot book listings" });
        }

        const { checkIn, checkOut, guests } = req.body.booking;
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        if (nights < 1) {
            return res.status(400).json({ error: "Check-out must be after check-in" });
        }

        const overlapping = await Booking.find({
            listing: listing._id,
            status: "confirmed",
            $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }]
        });
        if (overlapping.length > 0) {
            return res.status(400).json({ error: "These dates are already booked" });
        }

        const subtotal = listing.price * nights;
        const serviceFee = Math.round(subtotal * 0.12);
        const totalPrice = subtotal + serviceFee;

        if (listing.maxGuests && parseInt(guests) > listing.maxGuests) {
            return res.status(400).json({ error: `Maximum ${listing.maxGuests} guests allowed` });
        }

        const booking = new Booking({
            user: req.user._id,
            listing: listing._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            totalPrice,
            status: "pending"
        });
        await booking.save();
        res.status(201).json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports.getUserBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });
    res.json({ bookings });
};

module.exports.getBookingDetails = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId)
        .populate("listing")
        .populate("user", "username email");
    if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.user._id.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    res.json({ booking });
};

module.exports.cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.user.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    if (booking.status !== "confirmed") {
        return res.status(400).json({ error: "Only confirmed bookings can be cancelled" });
    }
    booking.status = "cancelled";
    await booking.save();
    res.json({ success: true, booking });
};

module.exports.deleteBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.user.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    if (booking.status !== "pending") {
        return res.status(400).json({ error: "Only pending bookings can be deleted" });
    }
    await Booking.findByIdAndDelete(req.params.bookingId);
    res.json({ success: true, message: "Booking deleted" });
};

module.exports.getListingBookings = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }
    if (!listing.owner.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    const bookings = await Booking.find({ listing: req.params.id })
        .populate("user", "username email")
        .sort({ createdAt: -1 });
    res.json({ bookings, listing });
};

module.exports.getHostDashboard = async (req, res) => {
    if (req.user.role !== 'host') {
        return res.status(403).json({ error: "Only hosts can access the dashboard" });
    }
    const listings = await Listing.find({ owner: req.user._id });
    const listingIds = listings.map(l => l._id);
    const bookings = await Booking.find({ listing: { $in: listingIds } })
        .populate("listing")
        .populate("user", "username email")
        .sort({ createdAt: -1 });
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    res.json({ bookings, listings, stats: { pending: pendingBookings, confirmed: confirmedBookings } });
};

module.exports.confirmBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate('listing');
    if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.listing.owner.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    if (booking.status !== 'pending') {
        return res.status(400).json({ error: "Only pending bookings can be confirmed" });
    }
    booking.status = 'confirmed';
    await booking.save();
    res.json({ success: true, booking });
};

module.exports.rejectBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId).populate('listing');
    if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
    }
    if (!booking.listing.owner.equals(req.user._id)) {
        return res.status(403).json({ error: "Not authorized" });
    }
    if (booking.status !== 'pending') {
        return res.status(400).json({ error: "Only pending bookings can be rejected" });
    }
    booking.status = 'rejected';
    await booking.save();
    res.json({ success: true, booking });
};
