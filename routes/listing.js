const express = require("express");
const router= express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn , isOwner , validateListing, isLoggedInForDelete,isLoggedInForEdit}=require("../middleware.js");
const listingController=require("../controllers/listings.js");
const multer = require("multer");
const {storage}=require("../cloudConfig.js");
const upload = multer({storage  });
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)  
);

router.get("/new",isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn,isOwner,upload.single("listing[image]"),validateListing,wrapAsync(listingController.updateListing))
    .delete(isLoggedInForDelete,isOwner,wrapAsync(listingController.deleteListing));

router.get("/:id/edit",
    isLoggedInForEdit,
    isOwner,
    wrapAsync(listingController.renderEditForm));

module.exports = router;