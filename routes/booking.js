const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn } = require("../middleware.js");

// Create a booking for a listing
router.post("/listings/:id/bookings", isLoggedIn, wrapAsync(bookingController.createBooking));

// Get all bookings for current user
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.getUserBookings));

// Get booking details
router.get("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.getBookingDetails));

// Cancel a booking
router.post("/bookings/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

// Delete a booking (only for pending status)
router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.deleteBooking));

// Get all bookings for a listing (owner view)
router.get("/listings/:id/bookings", isLoggedIn, wrapAsync(bookingController.getListingBookings));

// Host dashboard - get all bookings for host's listings
router.get("/host/dashboard", isLoggedIn, wrapAsync(bookingController.getHostDashboard));

// Confirm a booking (host only)
router.post("/host/bookings/:bookingId/confirm", isLoggedIn, wrapAsync(bookingController.confirmBooking));

// Reject a booking (host only)
router.post("/host/bookings/:bookingId/reject", isLoggedIn, wrapAsync(bookingController.rejectBooking));

module.exports = router;