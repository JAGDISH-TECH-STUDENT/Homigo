const express = require("express");
const methodOverride = require("method-override");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, isHost } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const bookingController = require("../controllers/bookings.js");
const Listing = require("../models/listing");
const User = require("../models/user");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router.use(methodOverride("_method"));

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isHost, upload.array("images"), wrapAsync(listingController.createListing));

router.get("/search", wrapAsync(listingController.searchListings));

router.get("/host/listings", isLoggedIn, wrapAsync(listingController.getHostListings));

router.get("/hosts", async (req, res) => {
    try {
        const hosts = await User.find({ role: 'host' }).select('_id username email createdAt');
        res.json({ users: hosts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id/bookings", isLoggedIn, wrapAsync(bookingController.getListingBookings));

router.put("/:id", isLoggedIn, isOwner, upload.array("newImages", 10), wrapAsync(listingController.updateListing));

router.get("/:id", wrapAsync(listingController.showListing));
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;