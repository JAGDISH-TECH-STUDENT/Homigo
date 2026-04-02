const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const favoriteController = require("../controllers/favorites.js");

router.get("/", isLoggedIn, wrapAsync(favoriteController.getFavorites));

router.post("/:id/toggle", isLoggedIn, wrapAsync(favoriteController.toggleFavorite));

module.exports = router;
