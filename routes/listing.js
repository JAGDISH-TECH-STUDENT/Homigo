const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, isHost, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const bookingController = require("../controllers/bookings.js");
const Listing = require("../models/listing");
const User = require("../models/user");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, callback) => {
        if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) return callback(null, true);
        callback(new Error("Only PNG, JPG, GIF, and WebP images are allowed"));
    }
});
const { cache } = require("../utils/cache.js");

router.use(methodOverride("_method"));

router.route("/")
    .get(cache("15 minutes"), wrapAsync(listingController.index))
    .post(isHost, upload.array("images", 10), validateListing, wrapAsync(listingController.createListing));

router.get("/search", cache("10 minutes"), wrapAsync(listingController.searchListings));

router.get("/host/listings", isLoggedIn, wrapAsync(listingController.getHostListings));

router.get("/hosts", cache("15 minutes"), async (req, res) => {
    try {
        const hosts = await User.find({ role: 'host' }).select('_id username email createdAt');
        res.json({ users: hosts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id/bookings", isLoggedIn, wrapAsync(bookingController.getListingBookings));

router.put("/:id", isLoggedIn, isOwner, upload.array("newImages", 10), wrapAsync(listingController.updateListing));

router.get("/:id", (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Invalid listing ID" });
    }
    next();
}, cache("10 minutes"), wrapAsync(listingController.showListing));
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;