import jwt from "jsonwebtoken";
import User from "../models/User.js";
import mockStore from "../services/mockStore.js";
import { isDatabaseEnabled } from "../services/runtimeConfig.js";

/**
 * Verifies the JWT token provided via Authorization header.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Missing authorization token", data: null });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, secret);
    const user = isDatabaseEnabled
      ? await User.findById(decoded.userId).select("-__v")
      : mockStore.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token", data: null });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized", data: null });
  }
};
