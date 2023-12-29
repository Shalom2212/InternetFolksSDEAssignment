function extractToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (token) {
      req.token = token;
      next();
    } else {
      return res.status(403).json({ message: "Token is missing" });
    }
  } else {
    return res.status(401).json({
      status: false,
      errors: [
        {
          message: "You need to sign in to proceed.",
          code: "NOT_SIGNEDIN",
        },
      ],
    });
  }
}

module.exports = extractToken;
