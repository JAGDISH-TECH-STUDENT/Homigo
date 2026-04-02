const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user.js");
const { isLoggedIn } = require("../middleware.js");

router.post("/signup", userController.signUp);
router.post("/login", passport.authenticate("local"), userController.login);
router.get("/logout", userController.logout);
router.get("/me", userController.getMe);
router.post("/upgrade-to-host", isLoggedIn, userController.upgradeToHost);

module.exports = router;
