const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router
  .route("/role")
  .get(roleController.getAllRoles)
  .post(roleController.createRole);

module.exports = router;
