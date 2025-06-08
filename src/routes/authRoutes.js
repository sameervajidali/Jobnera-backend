import express from 'express';
import passport from 'passport';
import upload from '../config/multer.js';
import {
  register,
  activateAccount,
  login,
  googleAuth,
  facebookAuth,
  refreshToken,
  logout,
  requestPasswordReset,
  resetPassword,
  getProfile,
  changePassword,
  updateProfile,
  deleteAccount,
  checkEmailAvailability,
  getCurrentUser,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../validators/validate.js';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from '../validators/authValidator.js';

import { handleGitHubCallback } from '../controllers/githubOAuthController.js';

const router = express.Router();

// ─── Local Auth ─────────────────────────────────────────────
router.get('/check-email', checkEmailAvailability);
router.post('/register', validate(registerSchema), register);
router.get('/activate-account', activateAccount);
router.post('/login', validate(loginSchema), login);

// ─── Social Auth ─────────────────────────────────────────────
router.post('/google/', googleAuth);
router.post('/facebook', facebookAuth);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  handleGitHubCallback
);

// ─── Tokens & Sessions ───────────────────────────────────────
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

// ─── Authenticated User ──────────────────────────────────────
router.get('/me', protect, getCurrentUser);

// ─── Password Reset ──────────────────────────────────────────
router.post(
  '/request-password-reset',
  validate(passwordResetRequestSchema),
  requestPasswordReset
);
router.post('/reset-password', validate(passwordResetSchema), resetPassword);
router.put('/change-password', protect, changePassword);

// ─── Profile ─────────────────────────────────────────────────
router.get('/profile', protect, getProfile);
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  updateProfile
);
router.delete('/profile', protect, deleteAccount);

export default router;


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "vajid@example.com"
 *               password:
 *                 type: string
 *                 example: "supersecurepassword"
 *           example:
 *             email: "vajid@example.com"
 *             password: "supersecurepassword"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               message: "Login successful"
 *               user:
 *                 _id: "666cb2aec5f26c18b4cb236a"
 *                 name: "Vajid Ali"
 *                 email: "vajid@example.com"
 *                 role: "USER"
 *                 avatar: "https://cdn.jobneura.tech/avatars/vajid.jpg"
 *               accessToken: "JWT_TOKEN_HERE"
 *               refreshToken: "REFRESH_TOKEN_HERE"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             example:
 *               message: "Invalid email or password"
 *       403:
 *         description: User account not activated or locked
 *         content:
 *           application/json:
 *             example:
 *               message: "Account not activated"
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             example:
 *               message: "Too many login attempts. Please try again later."
 */
