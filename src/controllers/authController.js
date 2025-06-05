import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import Role from '../models/Role.js'; // Import your Role model
import {
  sendActivationEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendActivationSuccessEmail
} from '../services/emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'https://jobneura.tech';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ────────────────────────────────────────────────────────────────
// Create access token (JWT) with 15 min expiry
const createAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

// Create refresh token (JWT) with 7 day expiry
const createRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Secure cookie options for auth tokens
const cookieOptions = {
  domain: process.env.NODE_ENV === 'production' ? '.jobneura.tech' : 'localhost',
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
};

// ─── Register ───────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  // Find default role (e.g., 'USER')
  const defaultRole = await Role.findOne({ name: 'USER' });
  if (!defaultRole) {
    return res.status(500).json({ message: 'Default user role not found in the system.' });
  }

  // Generate activation token and activation link
  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationLink = `${CLIENT_URL}/activate?token=${activationToken}`;

  // Create user with hashed password (assumed User model handles hashing)
  const newUser = await User.create({
    name,
    email,
    password,
    role: defaultRole._id,  // Assign role ID
    isVerified: false,
    provider: 'local',
    activationToken
  });

  // Send activation email (async catch errors silently)
  sendActivationEmail(email, name, activationLink).catch(console.error);

  res.status(201).json({ message: 'Registered! Check your email.' });
});

// ─── Activate ───────────────────────────────────────────────────────────────
export const activateAccount = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ activationToken: token });
  if (!user) return res.status(400).json({ message: 'Invalid token.' });

  user.isVerified = true;
  user.activationToken = undefined;
  await user.save();
  await sendActivationSuccessEmail(user.email, user.name);

  res.status(200).json({ message: 'Account activated.' });
});

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Derive client IP supporting proxies
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  const ua = req.get('User-Agent') || 'unknown';

  // 1️⃣ Validate inputs
  if (!email || !password) {
    await LoginHistory.create({ user: null, ip, userAgent: ua, success: false });
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // 2️⃣ Find user and select password explicitly (hidden by default)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    await LoginHistory.create({ user: null, ip, userAgent: ua, success: false });
    return res.status(404).json({ message: 'No account found with this email.' });
  }

  // 3️⃣ Check email verification status
  if (!user.isVerified) {
    await LoginHistory.create({ user: user._id, ip, userAgent: ua, success: false });
    return res.status(403).json({ message: 'Please verify your email first.' });
  }

  // 4️⃣ Verify password using bcrypt
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await LoginHistory.create({ user: user._id, ip, userAgent: ua, success: false });
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  // 5️⃣ Update last login timestamp without triggering validators
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // 6️⃣ Geo-lookup (optional, failure logged but ignored)
  let geo = {};
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const geoJson = await geoRes.json();
    if (geoJson.status === 'success') {
      geo = {
        country: geoJson.country,
        region: geoJson.regionName,
        city: geoJson.city,
      };
    }
  } catch (err) {
    console.warn('Geo lookup error:', err);
  }

  // 7️⃣ Log login history with success and geo info
  await LoginHistory.create({
    user: user._id,
    ip,
    userAgent: ua,
    success: true,
    ...geo,
  });

  // 8️⃣ Generate JWT access and refresh tokens
  const accessToken = createAccessToken({ userId: user._id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user._id });

  // 9️⃣ Set tokens as secure HttpOnly cookies and send safe user info
  res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

  // Return user without sensitive fields, with populated role name
  const safeUser = await User.findById(user._id)
    .select('-password -refreshTokens -resetToken -activationToken')
    .populate('role', 'name')
    .lean();

  res.status(200).json({
    message: 'Login successful',
    user: safeUser
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  res
    .clearCookie('accessToken', { path: '/', domain: '.jobneura.tech' })
    .clearCookie('refreshToken', { path: '/', domain: '.jobneura.tech' })
    .status(200)
    .json({ message: 'Logged out successfully' });
};

// ─── Refresh ───────────────────────────────────────────────────────────────────
// Refresh Token Controller
export const refreshToken = asyncHandler(async (req, res) => {
  // 1) Read the raw cookie
  const raw = req.cookies.refreshToken;
  console.log('🔍 [refresh-token] raw cookie:', raw);
  console.log('🔍 [refresh-token] secret loaded:', !!process.env.JWT_REFRESH_SECRET);

  if (!raw) {
    console.warn('🚫 No refresh token provided');
    return res.status(401).json({ message: 'No refresh token found. Please login again.' });
  }

  try {
    // 2) Verify & decode into an object
    const decoded = jwt.verify(raw, process.env.JWT_REFRESH_SECRET);
    console.log('✅ [refresh-token] decoded payload:', decoded);

    // 3) Look up the user from the payload
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.warn('🚫 No user found for payload.userId:', decoded.userId);
      return res.status(401).json({ message: 'Invalid refresh token. Please login again.' });
    }

    // 4) Issue new tokens
    const newAccessToken = createAccessToken({ userId: user._id, role: user.role });
    const newRefreshToken = createRefreshToken({ userId: user._id });

    // 5) Set cookies & return the updated user
    return res
      .cookie('accessToken', newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie('refreshToken', newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        message: 'Access token refreshed.',
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          // …any other fields your frontend needs…
        },
      });
  } catch (err) {
    console.error('❌ [refresh-token] error verifying token:', err);
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// ─── Get Current User ────────────────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  console.log("🧁 Cookies:", req.cookies);

  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('role', 'name');    // populate role name

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ user });
};

// ─── Change Password ────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate new password length
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: 'New password must be at least 6 characters long.',
    });
  }

  // Find user with password for validation
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Validate current password if exists (not social login user)
  if (user.password) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }
  } else {
    // For social login users without existing password
    if (currentPassword) {
      return res.status(400).json({
        message: "You don't have an existing password. Leave 'Current Password' empty to set one.",
      });
    }
  }

  // Update password and send notification email
  user.password = newPassword;
  await user.save();
  await sendPasswordChangedEmail(user.email, user.name);
  res.status(200).json({ message: 'Password updated successfully.' });
});

// ─── Delete Account ───────────────────────────────────────────────────────────
export const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.userId);
  res.status(200).json({ message: 'Account deleted.' });
});

// ─── Google OAuth Login ───────────────────────────────────────────────────────
export const googleAuth = asyncHandler(async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log('🟢 googleAuth: received idToken:', idToken?.slice(0, 20) + '…');

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log('🟢 googleAuth: payload:', {
      email: payload.email,
      email_verified: payload.email_verified,
    });

    if (!payload.email_verified) {
      console.warn('⚠️ googleAuth: email not verified');
      return res.status(400).json({ message: 'Google email not verified.' });
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      console.log('🟢 googleAuth: creating new user');
      const userRole = await Role.findOne({ name: 'USER' });
      if (!userRole) throw new Error('Default USER role not found');

      user = await User.create({
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        isVerified: true,
        provider: 'google',
        role: userRole._id
      });
    } else {
      console.log('🟢 googleAuth: found existing user:', user._id);
    }

    // Issue tokens
    const accessToken = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id });

    // Set cookies & respond
    res
      .cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
      .cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .status(200)
      .json({ message: 'Google authentication successful', user });

    console.log('✅ googleAuth: success for user', user._id);

  } catch (err) {
    console.error('❌ googleAuth error:', err);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
});

// ─── Facebook Social Login ────────────────────────────────────────────────────
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

// ─── GitHub Social Login ──────────────────────────────────────────────────────
export const githubAuth = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Authorization code missing' });
  }

  // 1️⃣ Exchange code for GitHub access token
  const tokenRes = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );
  const accessToken = tokenRes.data.access_token;
  if (!accessToken) throw new Error('GitHub token exchange failed');

  // 2️⃣ Fetch user profile & emails
  const userRes = await axios.get('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const emailRes = await axios.get('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const primary = emailRes.data.find(e => e.primary && e.verified);
  if (!primary) throw new Error('GitHub email not verified');

  const email = primary.email;
  const name = userRes.data.name || userRes.data.login;
  const avatar = userRes.data.avatar_url;

  // 3️⃣ Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    console.log('🟢 githubAuth: creating new user');
    const userRole = await Role.findOne({ name: 'USER' });
    if (!userRole) throw new Error('Default USER role not found');

    user = await User.create({
      name,
      email,
      avatar,
      isVerified: true,
      provider: 'github',
      role: userRole._id,
    });
  } else {
    console.log('🟢 githubAuth: found existing user', user._id);
  }

  // 4️⃣ Issue JWTs
  const accessTokenJwt = createAccessToken({ userId: user._id, role: user.role });
  const refreshTokenJwt = createRefreshToken({ userId: user._id });

  // 5️⃣ Set cookies & respond
  res
    .cookie('accessToken', accessTokenJwt, { ...cookieOptions, maxAge: 15 * 60 * 1000 })
    .cookie('refreshToken', refreshTokenJwt, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .status(200)
    .json({ message: 'GitHub authentication successful', user });
});

// ─── Get Profile ─────────────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ user });
});

// ─── Password Reset Requests ──────────────────────────────────────────────────
export const requestPasswordReset = asyncHandler(async (req, res) => {
  console.log("📨 Password reset route HIT");

  const { email } = req.body;
  console.log("👉 Email received:", email);
  const user = await User.findOne({ email });
  if (!user) {
    // Silent to avoid user enumeration
    return res.status(200).json({ message: "If this email exists, a reset link has been sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour expiry
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendResetPasswordEmail(user.email, user.name, resetLink);

  res.status(200).json({ message: "If this email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  console.log("📥 Reset request body:", req.body);

  const { token, password } = req.body;
  if (!token || !password) {
    console.log("❌ Missing token or password");
    return res.status(400).json({ message: "Token and password required." });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    console.log("❌ Invalid or expired token");
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  console.log("✅ Password reset successful for:", user.email);

  res.status(200).json({ message: "Password updated successfully." });
});

// ─── Update Profile ──────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  // Destructure fields
  const {
    name, phone, location, bio, website, linkedin,
    skills, languages, experience, education, avatar, resume
  } = req.body;

  // Prepare update object with parsing for JSON strings
  const updates = {
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(location !== undefined && { location }),
    ...(bio !== undefined && { bio }),
    ...(website !== undefined && { website }),
    ...(linkedin !== undefined && { linkedin }),
    ...(skills !== undefined && { skills: typeof skills === 'string' ? JSON.parse(skills) : skills }),
    ...(languages !== undefined && { languages: typeof languages === 'string' ? JSON.parse(languages) : languages }),
    ...(experience !== undefined && { experience: typeof experience === 'string' ? JSON.parse(experience) : experience }),
    ...(education !== undefined && { education: typeof education === 'string' ? JSON.parse(education) : education }),
    ...(avatar !== undefined && { avatar }),
    ...(resume !== undefined && { resume }),
  };

  // Update user and return new data
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updated) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ message: 'Profile updated', user: updated });
});

// ─── Check Email Availability ────────────────────────────────────────────────
export const checkEmailAvailability = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query parameter is required." });
  }

  const exists = await User.exists({ email: email.toLowerCase() });

  res.status(200).json({ available: !exists });
};
