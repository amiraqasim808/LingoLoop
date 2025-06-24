import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const tokenFromCookie = req.cookies.jwt;

    if (!tokenFromCookie) {
      return res.status(401).json({ message: "Access denied: No token" });
    }

    const decodedData = jwt.verify(tokenFromCookie, process.env.JWT_SECRET);

    if (!decodedData) {
      return res.status(401).json({ message: "Access denied: Invalid token" });
    }

    const currentUser = await User.findById(decodedData.userId).select(
      "-password"
    );

    if (!currentUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // Attach authenticated user to request object
    req.user = currentUser;

    next();
  } catch (err) {
    console.error("🚨 protectRoute error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
