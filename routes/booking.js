const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const bookingController = require("../controllers/bookings.js");
const { isLoggedIn } = require("../middleware.js");

router.post("/listings/:id/bookings", isLoggedIn, wrapAsync(bookingController.createBooking));

router.get("/bookings", isLoggedIn, wrapAsync(bookingController.getUserBookings));

router.get("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.getBookingDetails));

router.post("/bookings/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

router.delete("/bookings/:bookingId", isLoggedIn, wrapAsync(bookingController.deleteBooking));

router.get("/listings/:id/bookings", isLoggedIn, wrapAsync(bookingController.getListingBookings));

router.get("/host/dashboard", isLoggedIn, wrapAsync(bookingController.getHostDashboard));

router.post("/host/bookings/:bookingId/confirm", isLoggedIn, wrapAsync(bookingController.confirmBooking));

router.post("/host/bookings/:bookingId/reject", isLoggedIn, wrapAsync(bookingController.rejectBooking));

module.exports = router;