require("dotenv").config();
const express = require("express");
const roleRoute = require("./routes/roleRoute");
const authRoute = require("./routes/authRoute");
const communityRoute = require("./routes/communityRoute");
const memberRoute = require("./routes/memberRoute");
const app = express();

app.use(express.json());
app.use("/v1", roleRoute);
app.use("/v1", authRoute);
app.use("/v1", communityRoute);
app.use("/v1", memberRoute);

app.all("*", (req, res) => {
  res.status(404).send("404 NOT FOUND");
});

module.exports = app;
