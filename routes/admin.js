const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isAdmin } = require("../middleware");
const adminController = require("../controllers/admin");

// All admin routes require admin role
router.use(isAdmin);

// Dashboard
router.get("/dashboard", wrapAsync(adminController.renderDashboard));

// User Management
router.get("/users", wrapAsync(adminController.renderUsers));
router.get("/users/:id/edit", wrapAsync(adminController.renderEditUser));
router.put("/users/:id", wrapAsync(adminController.updateUser));
router.delete("/users/:id", wrapAsync(adminController.deleteUser));

// Listing Management
router.get("/listings", wrapAsync(adminController.renderListings));
router.get("/listings/:id/edit", wrapAsync(adminController.renderEditListing));
router.delete("/listings/:id", wrapAsync(adminController.deleteListing));

// Booking Management
router.get("/bookings", wrapAsync(adminController.renderBookings));
router.delete("/bookings/:id", wrapAsync(adminController.deleteBooking));

// Review Management
router.get("/reviews", wrapAsync(adminController.renderReviews));
router.delete("/reviews/:id", wrapAsync(adminController.deleteReview));

module.exports = router;
