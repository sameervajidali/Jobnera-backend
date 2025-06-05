import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * Middleware to protect routes using JWT authentication.
 * Supports tokens in Authorization header or HttpOnly cookie.
 * Attaches the authenticated user object to req.user with role name populated.
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1️⃣ Extract token from Authorization header if available
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2️⃣ Fallback to token from HttpOnly cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  // 3️⃣ If no token found, deny access
  if (!token) {
    return res.status(401).json({ message: 'Not authorized: token missing' });
  }

  try {
    // 4️⃣ Verify token and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Lookup user by ID in token payload; populate role name for authorization checks
    const user = await User.findById(decoded.userId || decoded.id)
      .select('-password')
      .populate('role', 'name');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    // 6️⃣ Optional brute-force protection: check account lock status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: 'Account locked due to too many login attempts' });
    }

    // 7️⃣ Attach sanitized user object with string role to request for downstream use
    req.user = {
      ...user.toObject(),
      role: user.role?.name || '',
    };

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Not authorized: token invalid' });
  }
});

/**
 * Middleware to restrict access by user roles.
 * Accepts multiple role strings or a single array of roles.
 * Roles are normalized to uppercase for case-insensitive matching.
 */
export const requireRole = (...args) => {
  // Flatten roles if single array provided
  const allowedRoles =
    args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

  const allowedUpper = allowedRoles.map(r => ('' + r).toUpperCase());

  return (req, res, next) => {
    const userRole = typeof req.user.role === 'string'
      ? req.user.role.toUpperCase()
      : '';

    if (!allowedUpper.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
