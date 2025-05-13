
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import LoginHistory from '../models/LoginHistory.js';
import {
  sendActivationEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendActivationSuccessEmail
} from '../services/emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'https://jobneura.tech';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ────────────────────────────────────────────────────────────────
const createAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
const createRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const cookieOptions = {
  domain: process.env.NODE_ENV === 'production'
    ? '.jobneura.tech'
    : 'localhost',
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'None',
};

// ─── Register ───────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' });
  if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered.' });

  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationLink = `${CLIENT_URL}/activate?token=${activationToken}`;

  const newUser = await User.create({ name, email, password, isVerified: false, provider: 'local', activationToken });
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

// // ─── Login ───────────────────────────────────────────────────────────────────


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Derive client IP (supports proxies)
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  const ua = req.get('User-Agent') || 'unknown';

  // 1️⃣ Validate inputs
  if (!email || !password) {
    await LoginHistory.create({ user: null, ip, userAgent: ua, success: false });
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // 2️⃣ Find user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    await LoginHistory.create({ user: null, ip, userAgent: ua, success: false });
    return res.status(404).json({ message: 'No account found with this email.' });
  }

  // 3️⃣ Check verification
  if (!user.isVerified) {
    await LoginHistory.create({ user: user._id, ip, userAgent: ua, success: false });
    return res.status(403).json({ message: 'Please verify your email first.' });
  }

  // 4️⃣ Verify password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    await LoginHistory.create({ user: user._id, ip, userAgent: ua, success: false });
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  // 5️⃣ Record last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  // 6️⃣ Geo-lookup (optional)
  let geo = {};
  try {
    const geoRes  = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    const geoJson = await geoRes.json();
    if (geoJson.status === 'success') {
      geo = {
        country: geoJson.country,
        region:  geoJson.regionName,
        city:    geoJson.city,
      };
    }
  } catch (err) {
    console.warn('Geo lookup error:', err);
  }

  // 7️⃣ Log a single history entry
  await LoginHistory.create({
    user:      user._id,
    ip,
    userAgent: ua,
    success:   true,
    ...geo,
  });

  // 8️⃣ Generate & set tokens
  const accessToken  = createAccessToken({ userId: user._id, role: user.role });
  const refreshToken = createRefreshToken({ userId: user._id });

 
    res
    .cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

  // 9️⃣ Return the safe user object
  const safeUser = await User.findById(user._id)
  .select('-password -refreshTokens -resetToken -activationToken')
  .populate('role', 'name')   // ← add this
  .lean();


  res.status(200).json({
    message: 'Login successful',
    user:    safeUser
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

// ─── Refresh ─────────────────────────────────────────────────────────────────
// Refresh Token Controller
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  
  if (!token) {
    return res.status(401).json({ message: 'No refresh token found. Please login again.' });
  }

  try {
    // Verify the refresh token
    const { userId } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    // Find the user associated with the token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found for the provided refresh token. Please login again.' });
    }

    // Generate new access token
    const newAccessToken = createAccessToken({ userId: user._id, role: user.role });

    // Optionally rotate the refresh token (for additional security)
    const newRefreshToken = createRefreshToken({ userId: user._id });

    // Store the new refresh token (optional: save in DB or Redis for better security)
    // Example: await user.update({ refreshToken: newRefreshToken });

    // Send the new tokens via cookies
    res
      .cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 })  // 15 minutes
      .cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })  // 7 days
      .status(200)
      .json({ message: 'Access token refreshed.' });

  } catch (err) {
    console.error('Refresh Token Error:', err); // Optional: log error for debugging (don't expose sensitive details)
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
});

// ─── Get Current User ────────────────────────────────────────────────────────

export const getCurrentUser = async (req, res) => {
  console.log("🧁 Cookies:", req.cookies);

  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('role', 'name');    // ← populate role.name here

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ user });
};




// ─── Change Password ────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 🔒 Validate input
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: 'New password must be at least 6 characters long.',
    });
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // 🔐 For regular users with existing password
  if (user.password) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }
  } else {
    // 👥 For social login users without password
    if (currentPassword) {
      return res.status(400).json({
        message: "You don't have an existing password. Leave 'Current Password' empty to set one.",
      });
    }
  }

  user.password = newPassword;
  await user.save();
  await sendPasswordChangedEmail(user.email, user.name);
  res.status(200).json({ message: 'Password updated successfully.' });
});


export const deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user.userId);
  res.status(200).json({ message: 'Account deleted.' });
});




// ─── Google Social Login/Signup ───────────────────────────────────────────────
// export const googleAuth = asyncHandler(async (req, res) => {
//   const { idToken } = req.body;
//   const ticket = await googleClient.verifyIdToken({
//     idToken,
//     audience: process.env.GOOGLE_CLIENT_ID,
//   });
//   const { email, name, picture, email_verified } = ticket.getPayload();
//   if (!email_verified) {
//     return res.status(400).json({ message: 'Google email not verified.' });
//   }

//   let user = await User.findOne({ email });
//   if (!user) {
//     user = await User.create({
//       name,
//       email,
//       avatar: picture,
//       isVerified: true,
//       provider: 'google',
//     });
//   }

//   const accessToken = createAccessToken({ userId: user._id, role: user.role });
//   const refreshToken = createRefreshToken({ userId: user._id });

//   res
//     .cookie('accessToken', accessToken, {
//       ...cookieOptions,
//       maxAge: 15 * 60 * 1000,
//     })
//     .cookie('refreshToken', refreshToken, {
//       ...cookieOptions,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     })
//     .status(200)
//     .json({ message: 'Google authentication successful', user });
// });

export const googleAuth = asyncHandler(async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log('🟢 googleAuth: received idToken:', idToken?.slice(0, 20) + '…');

    // 1) Verify the token
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

    // 2) Find or create the user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      console.log('🟢 googleAuth: creating new user');

      const userRole = await Role.findOne({ name: 'USER' });
      user = await User.create({
        name:        payload.name,
        email:       payload.email,
        avatar:      payload.picture,
        isVerified:  true,
        provider:    'google',
      });
    } else {
      console.log('🟢 googleAuth: found existing user:', user._id);
    }

    // 3) Issue tokens
    const accessToken  = createAccessToken({ userId: user._id, role: user.role });
    const refreshToken = createRefreshToken({ userId: user._id });

    // 4) Set cookies & respond
    res
      .cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,      // 15 minutes
      })
      .cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
      })
      .status(200)
      .json({ message: 'Google authentication successful', user });

    console.log('✅ googleAuth: success for user', user._id);

  } catch (err) {
    console.error('❌ googleAuth error:', err);
    // Send back the error message for debugging (you can remove details in prod)
    res.status(500).json({
      message: 'Google login failed',
      error:   err.message,
      stack:   process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
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



export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.status(200).json({ user });
});



// ─────────────────────────────────────────────────────────────────────────────
// Password Reset
// ─────────────────────────────────────────────────────────────────────────────
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

  user.password = await bcrypt.hash(password, 12);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  console.log("✅ Password reset successful for:", user.email);

  res.status(200).json({ message: "Password updated successfully." });
});


// controllers/authController.js

// export const updateProfile = asyncHandler(async (req, res) => {
//   const {
//     name, phone, location, bio,
//     skills, languages, experience, education
//   } = req.body;

//   const updates = {
//     name, phone, location, bio,
//     // Parse JSON arrays if needed:
//     skills: skills ? JSON.parse(skills) : [],
//     languages: languages ? JSON.parse(languages) : [],
//     experience: experience ? JSON.parse(experience) : [],
//     education: education ? JSON.parse(education) : [],
//   };

//   // Handle avatar and resume uploads
//   if (req.files.avatar) {
//     const relPath = `/uploads/${req.files.avatar[0].filename}`;
//     updates.avatar = `${req.protocol}://${req.get("host")}${relPath}`;
//   }
  
//   if (req.files.resume) {
//     const filename = req.files.resume[0].filename;
//     const url = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
//     updates.resume = url;
//   }
//   console.log('Avatar URL:', updates.avatar);
// console.log('Resume URL:', updates.resume);

  
//   try {
//     // Update the user in the database
//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       updates,
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Log the updated user data
//     console.log('Updated user data:', user);

//     // Respond with the updated user object
//     res.status(200).json({ message: 'Profile updated.', user });
//   } catch (error) {
//     console.error('Error updating profile:', error);
//     res.status(500).json({ message: 'Error updating profile', error: error.message });
//   }
// });


export const updateProfile = asyncHandler(async (req, res) => {
  // 1) Destructure expected fields from JSON body
  const {
    name,
    phone,
    location,
    bio,
    website,
    linkedin,
    skills,
    languages,
    experience,
    education,
    avatar,
    resume
  } = req.body;

  // 2) Build an updates object, parsing arrays if they arrive as strings
  const updates = {
    ...(name      !== undefined && { name }),
    ...(phone     !== undefined && { phone }),
    ...(location  !== undefined && { location }),
    ...(bio       !== undefined && { bio }),
    ...(website   !== undefined && { website }),
    ...(linkedin  !== undefined && { linkedin }),
    ...(skills    !== undefined && { skills: typeof skills === 'string' ? JSON.parse(skills) : skills }),
    ...(languages !== undefined && { languages: typeof languages === 'string' ? JSON.parse(languages) : languages }),
    ...(experience!== undefined && { experience: typeof experience === 'string' ? JSON.parse(experience) : experience }),
    ...(education !== undefined && { education: typeof education === 'string' ? JSON.parse(education) : education }),
    ...(avatar    !== undefined && { avatar }),   // URL from Firebase
    ...(resume    !== undefined && { resume })    // URL from Firebase
  };

  // 3) Update the user document
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updated) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // 4) Return the updated user
  res.json({ message: 'Profile updated', user: updated });
});




// ─── Check Email Availability ─────────────────────────────────────────────
export const checkEmailAvailability = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email query parameter is required." });
  }

  const exists = await User.exists({ email: email.toLowerCase() });

  res.status(200).json({ available: !exists });
};
