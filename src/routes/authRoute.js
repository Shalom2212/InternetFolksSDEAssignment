const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const extractToken = require("../middleware/extractToken");

router.post("/auth/signup", authController.signUp);
router.post("/auth/signin", authController.signIn);
router.get("/auth/me", extractToken, authController.getMe);

module.exports = router;
