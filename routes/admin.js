const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isAdmin } = require("../middleware");
const adminController = require("../controllers/admin");

router.use(isAdmin);

router.get("/dashboard", wrapAsync(adminController.renderDashboard));

router.get("/users", wrapAsync(adminController.renderUsers));
router.get("/users/:id/edit", wrapAsync(adminController.renderEditUser));
router.put("/users/:id", wrapAsync(adminController.updateUser));
router.delete("/users/:id", wrapAsync(adminController.deleteUser));

router.post("/users/:id/block", wrapAsync(adminController.blockUser));
router.post("/users/:id/unblock", wrapAsync(adminController.unblockUser));
router.post("/users/:id/message", wrapAsync(adminController.sendMessageToUser));

router.get("/listings", wrapAsync(adminController.renderListings));
router.get("/listings/:id/edit", wrapAsync(adminController.renderEditListing));
router.delete("/listings/:id", wrapAsync(adminController.deleteListing));
router.put("/listings/:id/deactivate", wrapAsync(adminController.deactivateListing));
router.put("/listings/:id/activate", wrapAsync(adminController.activateListing));

router.get("/bookings", wrapAsync(adminController.renderBookings));
router.delete("/bookings/:id", wrapAsync(adminController.deleteBooking));

router.get("/reviews", wrapAsync(adminController.renderReviews));
router.delete("/reviews/:id", wrapAsync(adminController.deleteReview));

module.exports = router;
