const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.createBooking = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

                if (listing.owner.equals(req.user._id)) {
            req.flash("error", "You cannot book your own listing!");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
                if (req.user.role === 'host') {
            req.flash("error", "Hosts cannot book listings. Only guests can make bookings.");
            return res.redirect(`/listings/${req.params.id}`);
        }

        const { checkIn, checkOut, guests } = req.body.booking;
        
                const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            req.flash("error", "Invalid date format!");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
                const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        if (nights < 1) {
            req.flash("error", "Check-out must be after check-in!");
            return res.redirect(`/listings/${req.params.id}`);
        }

                const overlapping = await Booking.find({
            listing: listing._id,
            status: "confirmed",
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });
        if (overlapping.length > 0) {
            req.flash("error", "These dates are already booked!");
            return res.redirect(`/listings/${req.params.id}`);
        }

                const subtotal = listing.price * nights;
        const serviceFee = Math.round(subtotal * 0.12);
        const totalPrice = subtotal + serviceFee;

                if (listing.maxGuests && parseInt(guests) > listing.maxGuests) {
            req.flash("error", `Maximum ${listing.maxGuests} guests allowed for this listing!`);
            return res.redirect(`/listings/${req.params.id}`);
        }

        const booking = new Booking({
            user: req.user._id,
            listing: listing._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests),
            totalPrice: totalPrice,
            status: "pending"
        });

        await booking.save();
        
        req.flash("success", "Booking confirmed! Your reservation is complete.");
        res.redirect(`/listings/${req.params.id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.getUserBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("listing")
            .sort({ createdAt: -1 });
        
        res.render("bookings/index.ejs", { bookings });
    } catch (err) {
        next(err);
    }
};

module.exports.getBookingDetails = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate("listing")
            .populate("user", "username email");
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }
        
                if (!booking.user._id.equals(req.user._id)) {
            req.flash("error", "You are not authorized to view this booking!");
            return res.redirect("/bookings");
        }
        
        res.render("bookings/show.ejs", { booking });
    } catch (err) {
        next(err);
    }
};

module.exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }
        
                if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You are not authorized to cancel this booking!");
            return res.redirect("/bookings");
        }

                if (booking.status !== "confirmed") {
            req.flash("error", "You can only cancel confirmed bookings!");
            return res.redirect("/bookings");
        }

        booking.status = "cancelled";
        await booking.save();
        
        req.flash("success", "Booking cancelled successfully!");
        res.redirect("/bookings");
    } catch (err) {
        next(err);
    }
};

module.exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/bookings");
        }
        
                if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You are not authorized to delete this booking!");
            return res.redirect("/bookings");
        }

                if (booking.status !== "pending") {
            req.flash("error", "You can only delete pending bookings!");
            return res.redirect("/bookings");
        }

        await Booking.findByIdAndDelete(req.params.bookingId);
        
        req.flash("success", "Booking deleted successfully!");
        res.redirect("/bookings");
    } catch (err) {
        next(err);
    }
};

module.exports.getListingBookings = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }
        
                if (!listing.owner.equals(req.user._id)) {
            req.flash("error", "You are not authorized to view these bookings!");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
        const bookings = await Booking.find({ listing: req.params.id })
            .populate("user", "username email")
            .sort({ createdAt: -1 });
        
        res.render("bookings/listing-bookings.ejs", { bookings, listing });
    } catch (err) {
        next(err);
    }
};

module.exports.getHostDashboard = async (req, res, next) => {
    try {
                if (req.user.role !== 'host') {
            req.flash("error", "Only hosts can access the host dashboard!");
            return res.redirect("/listings");
        }
        
                const listings = await Listing.find({ owner: req.user._id });
        const listingIds = listings.map(listing => listing._id);
        
                const bookings = await Booking.find({ listing: { $in: listingIds } })
            .populate("listing")
            .populate("user", "username email")
            .sort({ createdAt: -1 });
        
                const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        
        res.render("bookings/host-dashboard.ejs", { 
            bookings, 
            listings, 
            pendingBookings, 
            confirmedBookings 
        });
    } catch (err) {
        next(err);
    }
};

module.exports.confirmBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId).populate('listing');
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/host/dashboard");
        }
        
        if (!booking.listing.owner.equals(req.user._id)) {
            req.flash("error", "You are not authorized to confirm this booking!");
            return res.redirect("/host/dashboard");
        }
        
        if (booking.status !== 'pending') {
            req.flash("error", "Only pending bookings can be confirmed!");
            return res.redirect("/host/dashboard");
        }
        
        booking.status = 'confirmed';
        await booking.save();
        
        req.flash("success", "Booking confirmed successfully!");
        res.redirect("/host/dashboard");
    } catch (err) {
        next(err);
    }
};

module.exports.rejectBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId).populate('listing');
        
        if (!booking) {
            req.flash("error", "Booking not found!");
            return res.redirect("/host/dashboard");
        }
        
        if (!booking.listing.owner.equals(req.user._id)) {
            req.flash("error", "You are not authorized to reject this booking!");
            return res.redirect("/host/dashboard");
        }
        
        if (booking.status !== 'pending') {
            req.flash("error", "Only pending bookings can be rejected!");
            return res.redirect("/host/dashboard");
        }
        
        booking.status = 'rejected';
        await booking.save();
        
        req.flash("success", "Booking rejected successfully!");
        res.redirect("/host/dashboard");
    } catch (err) {
        next(err);
    }
};