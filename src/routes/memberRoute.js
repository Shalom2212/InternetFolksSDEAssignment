const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const extractToken = require("../middleware/extractToken");

router.post("/member", extractToken, memberController.addMember);
router.delete("/member/:id", extractToken, memberController.removeMember);

module.exports = router;
