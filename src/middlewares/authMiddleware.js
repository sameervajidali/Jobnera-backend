

// import jwt from 'jsonwebtoken';
// import asyncHandler from '../utils/asyncHandler.js';
// import User from '../models/User.js';

// /**
//  * Middleware to protect routes using JWT.
//  * Extracts token from Authorization header or cookies.
//  * Attaches { userId, role } to req.user.
//  */
// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // 1. Try Authorization header first
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer ')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }

//   // 2. Fall back to HttpOnly cookie
//   if (!token && req.cookies?.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   if (!token) {
//     res.status(401);
//     throw new Error('Not authorized: no token provided');
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.userId || decoded.id).select('-password');
//     if (!user) {
//       res.status(401);
//       throw new Error('Not authorized: user not found');
//     }

//     // Optional: Check for locked accounts
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       res.status(403);
//       throw new Error('Account locked due to too many login attempts');
//     }

//     // ✅ FIXED: Pass only minimal fields required downstream
//     req.user = user;

//     next();
//   } catch (err) {
//     res.status(401);
//     throw new Error('Not authorized: token invalid');
//   }
// });

// /**
//  * Middleware to restrict access by roles
//  * @param {Array<string>} roles - list of roles allowed (e.g., ['admin'])
//  */
// export const requireRole = (roles = []) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Not authorized' });
//     }

//     const userRole = req.user.role.toUpperCase();
//     const allowed = roles.map(r => r.toUpperCase());

//     if (!allowed.includes(userRole)) {
//       return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
//     }

//     next();
//   };
// };



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

  // 1️⃣ Try extracting from Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2️⃣ Fallback to secure HttpOnly cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized: token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use either decoded.userId or decoded.id (depending on your token payload)
    const user = await User.findById(decoded.userId || decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('Not authorized: user not found');
    }

    // 3️⃣ Optional: Account lockout mechanism (brute force protection)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      res.status(403);
      throw new Error('Account locked due to too many login attempts');
    }

    req.user = user; // ✅ Attach user to request for access in routes
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized: token invalid');
  }
});

/**
 * Middleware to restrict access by user role.
 * @param {Array<string>} roles - Roles allowed access (e.g. ['admin', 'superadmin'])
 */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const userRole = req.user.role?.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};
