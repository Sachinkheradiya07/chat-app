import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please login again."
        });
      }

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again."
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please login again."
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Authentication failed. Please login again."
        });
      }
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login to access this resource."
    });
  }
};

export { protect };