// // src/middleware/authMiddleware.js
// import jwt from 'jsonwebtoken';
// import asyncHandler from '../utils/asyncHandler.js';
// import User from '../models/User.js';

// /**
//  * Middleware to protect routes using JWT authentication.
//  * Supports tokens in Authorization header or HttpOnly cookie.
//  * Attaches the authenticated user object to req.user.
//  */
// export const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   // 1️⃣ Extract from Authorization header if present
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer ')
//   ) {
//     token = req.headers.authorization.split(' ')[1];
//   }

//   // 2️⃣ Fallback to HttpOnly cookie
//   if (!token && req.cookies?.accessToken) {
//     token = req.cookies.accessToken;
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized: token missing' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.userId || decoded.id).select('-password');

//     if (!user) {
//       return res.status(401).json({ message: 'Not authorized: user not found' });
//     }

//     // Optional: check for brute-force lockout
//     if (user.lockUntil && user.lockUntil > Date.now()) {
//       return res.status(403).json({ message: 'Account locked due to too many login attempts' });
//     }

//     req.user = user; // ✅ Attach user to request
//     next();
//   } catch (err) {
//     console.error("JWT verification failed:", err.message);
//     return res.status(401).json({ message: 'Not authorized: token invalid' });
//   }
// });


// export const requireRole = (...allowed) => (req, res, next) => {
//   // Extract a string roleName whether you're using an object or a raw string
//   const raw = req.user.role;
//   const roleName = typeof raw === 'object' && raw !== null
//     ? raw.name
//     : raw;
//   const upper = typeof roleName === 'string'
//     ? roleName.toUpperCase()
//     : '';

//   if (!allowed.map(r => r.toUpperCase()).includes(upper)) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
//   next();
// };


// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * Middleware to protect routes using JWT authentication.
 * Supports tokens in Authorization header or HttpOnly cookie.
 * Attaches the authenticated user object to req.user (with populated role name).
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

    // Populate the role name so we can inspect string in middleware
    const user = await User.findById(decoded.userId || decoded.id)
      .select('-password')
      .populate('role', 'name');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user not found' });
    }

    // Optional: check for brute-force lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ message: 'Account locked due to too many login attempts' });
    }

    // Attach only needed fields
    req.user = {
      ...user.toObject(),
      // ensure req.user.role is string for simpler checks
      role: user.role?.name || '',
    };
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Not authorized: token invalid' });
  }
});

/**
 * Middleware to require specific roles.
 * Can accept multiple string args or a single array of strings.
 */
export const requireRole = (...args) => {
  // Flatten if a single array was passed in
  const allowedRoles =
    args.length === 1 && Array.isArray(args[0]) ? args[0] : args;

  // Normalize to uppercase
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
