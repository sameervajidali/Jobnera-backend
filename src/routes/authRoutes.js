import express from 'express';
import passport from 'passport';
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
import upload from '../config/multer.js';
import { handleGitHubCallback } from '../controllers/githubOAuthController.js';

const router = express.Router();

// ─── Local Auth ─────────────────────────────────────────────
router.get('/check-email', checkEmailAvailability);
router.post('/register', validate(registerSchema), register);
router.get('/activate-account', activateAccount);
router.post('/login', validate(loginSchema), login);

// ─── Social Auth ─────────────────────────────────────────────
router.post('/google', googleAuth);
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
