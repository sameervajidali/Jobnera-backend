// src/utils/asyncHandler.js

// /**
//  * Wrap an async route handler to catch errors and forward to Express error middleware.
//  * Usage:
//  *   import asyncHandler from '../utils/asyncHandler.js';
//  *   router.get('/route', asyncHandler(async (req, res) => { /* ... */ }));
//  */
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
