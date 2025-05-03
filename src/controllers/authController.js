
// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import {
  sendActivationEmail,
  sendResetPasswordEmail,
} from '../services/emailService.js';
const isProduction = process.env.NODE_ENV === 'production';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ────────────────────────────────────────────────────────────────
const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const createRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Cookie helper
const cookieOptions = {
  httpOnly: true,
  secure: true,        // must be true for SameSite=None to work in modern browsers
  sameSite: isProduction ? 'None' : 'Lax',   // allow cross-site
  path: '/',           // ensure cookie is sent on all routes
};

// ─── Local Signup ─────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationLink = `${CLIENT_URL}/activate?token=${activationToken}`;

  const newUser = new User({
    name,
    email,
    password,           // pre-save hook will hash
    isVerified: false,
    provider: 'local',
    activationToken,
  });
  await newUser.save();
  sendActivationEmail(email, name, activationLink).catch(console.error);

  res.status(201).json({
    message: 'Registered! Check your email to activate your account.',
  });
});

// ─── Activate Account ─────────────────────────────────────────────────────────
export const activateAccount = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ message: 'Token missing.' });

  const user = await User.findOne({ activationToken: token });
  if (!user) return res.status(400).json({ message: 'Invalid token.' });

  user.isVerified = true;
  user.activationToken = undefined;
  await user.save();

  res.status(200).json({ message: 'Account activated successfully.' });
});

// ─── Local Login ──────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  // Issue tokens
  const accessToken = createAccessToken({ userId: user._id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user._id });
  user.password = undefined;

  res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,   // 15 minutes
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .status(200)
    .json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
});

// ─── Google Social Login/Signup ───────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, name, picture, email_verified } = ticket.getPayload();
  if (!email_verified) {
    return res.status(400).json({ message: 'Google email not verified.' });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      isVerified: true,
      provider: 'google',
    });
  }

  const accessToken = createAccessToken({ userId: user._id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user._id });

  res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ message: 'Google authentication successful', user });
});

// ─── Facebook Social Login/Signup ─────────────────────────────────────────────
export const facebookAuth = asyncHandler(async (req, res) => {
  const { accessToken: fbToken } = req.body;
  const fbRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${fbToken}`
  );
  const data = await fbRes.json();
  if (data.error) throw new Error('Facebook auth failed');

  const { email, name, picture } = data;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture.data.url,
      isVerified: true,
      provider: 'facebook',
    });
  }

  const accessToken = createAccessToken({ userId: user._id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user._id });

  res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ message: 'Facebook authentication successful', user });
});


// ─── GitHub Social Login/Signup ───────────────────────────────────────────────
export const githubAuth = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Authorization code missing' });

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('GitHub token exchange failed');

    // Get user data
    const userRes = await axios.get(`https://api.github.com/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const emailRes = await axios.get(`https://api.github.com/user/emails`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const primaryEmail = emailRes.data.find(e => e.primary && e.verified)?.email;

    const { name, avatar_url } = userRes.data;
    const email = primaryEmail;

    if (!email) throw new Error('GitHub email not verified');

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || 'GitHub User',
        email,
        avatar: avatar_url,
        isVerified: true,
        provider: 'github',
      });
    }

    const accessTokenJwt = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id });

    res
      .cookie('accessToken', accessTokenJwt, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ message: 'GitHub authentication successful', user });
  } catch (err) {
    console.error('❌ GitHub auth error:', err.message);
    res.status(500).json({ message: 'GitHub authentication failed' });
  }
});


// ─── Token Refresh ─────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'No refresh token.' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    const accessToken = createAccessToken({ userId: user._id, role: user.role });
    res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .status(200)
      .json({ message: 'Access token refreshed.' });
  } catch (err) {
    console.error('❌ Error verifying refresh token:', err.message);
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// ─── Logout ────────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  res
    .clearCookie('accessToken', { path: '/' })
    .clearCookie('refreshToken', { path: '/' })
    .status(200)
    .json({ message: 'Logged out successfully' });
};

// ─── Password Reset & Profile routes remain unchanged below… ──────────────────
// requestPasswordReset, resetPassword, getProfile, updateProfile, deleteAccount, getCurrentUser





// ─────────────────────────────────────────────────────────────────────────────
// Password Reset
// ─────────────────────────────────────────────────────────────────────────────
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600_000; // 1h
  await user.save();

  const link = `${CLIENT_URL}/reset-password?token=${token}`;
  await sendResetPasswordEmail(email, user.name, link);
  res.status(200).json({ message: 'Password reset link sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.status(200).json({ message: 'Password updated successfully.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile CRUD
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password').lean();
  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = { name: req.body.name };
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');
  res.status(200).json({ message: 'Profile updated.', user });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.userId);
  res.status(200).json({ message: 'Account deleted.' });
});



export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("+password");

  if (!user) return res.status(404).json({ message: "User not found." });

  res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      hasPassword: !!user.password, // <- Important addition
    },
  });
});


export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(userId).select("+password");
  if (!user) return res.status(404).json({ message: "User not found." });

  // If password is not set (social login user), allow setting a new one
  if (!user.password) {
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password set successfully." });
  }

  // For normal users, verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Incorrect current password." });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully." });
});