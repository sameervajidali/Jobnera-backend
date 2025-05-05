// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * Middleware to protect routes using JWT authentication.
 * Supports tokens in Authorization header or HttpOnly cookie.
 * Attaches the authenticated user object to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Extract from Authorization header if present
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2️⃣ Fallback to HttpOnly cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized: token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId || decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    // Optional: check for brute-force lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: 'Account locked due to too many login attempts' });
    }

    req.user = user; // ✅ Attach user to request
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return res.status(401).json({ message: 'Not authorized: token invalid' });
  }
});

/**
 * Middleware to restrict access by role.
 * Accepts an array of roles (case-insensitive).
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const userRole = req.user.role.toUpperCase();
    const allowedRoles = roles.map(role => role.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};
