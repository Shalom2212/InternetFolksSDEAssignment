const jwt = require("jsonwebtoken");

const secretKey = process.env.ACCESS_TOKEN_SECRET;

function generateAccessToken(user) {
  return jwt.sign({ user }, secretKey, { expiresIn: "1h" });
}

function extractDataFromToken(token) {
  try {
    const decodedToken = jwt.verify(token, secretKey);
    return decodedToken;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else {
      throw new Error("Invalid token");
    }
  }
}

module.exports = {
  generateAccessToken,
  extractDataFromToken,
};
