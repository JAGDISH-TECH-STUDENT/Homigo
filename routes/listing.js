const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing, isHost } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const bookingController = require("../controllers/bookings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isHost, upload.array("listing[images]"), validateListing, wrapAsync(listingController.createListing));

router.get("/search", wrapAsync(listingController.searchListings));

router.get("/host/listings", isLoggedIn, wrapAsync(listingController.getHostListings));

router.get("/:id/bookings", isLoggedIn, wrapAsync(bookingController.getListingBookings));

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.array("listing[images]"), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;
