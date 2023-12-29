const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const extractToken = require("../middleware/extractToken");

router.post("/community", extractToken, communityController.createCommunity);
router.get("/community", communityController.getAllCommunity);
router.get(
  "/community/:id/members",
  communityController.getAllCommunityMembers
);
router.get(
  "/community/me/owner",
  extractToken,
  communityController.getMyOwnedCommunity
);
router.get(
  "/community/me/member",
  extractToken,
  communityController.getMyJoinedCommunity
);

module.exports = router;
