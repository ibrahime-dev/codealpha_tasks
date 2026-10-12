import jwt from "jsonwebtoken";
import User from "../models/User.js";

const requireAuth = async (req, res, next) => {
  const authorization = req.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      return res.status(401).json({ message: "Authentication token is invalid." });
    }

    const user = await User.findById(decoded.sub).select("_id name email");

    if (!user) {
      return res.status(401).json({ message: "The user for this token no longer exists." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Authentication token is invalid or expired." });
    }

    return next(error);
  }
};

export default requireAuth;
